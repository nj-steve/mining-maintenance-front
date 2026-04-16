import { computed, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import { defineStore } from 'pinia';
import { useLoading } from '@sa/hooks';
import { fetchGetUserInfo, fetchLogin } from '@/service/api';
import { useRouterPush } from '@/hooks/common/router';
import { localStg } from '@/utils/storage';
import { SetupStoreId } from '@/enum';
import { $t } from '@/locales';
import { useRouteStore } from '../route';
import { useTabStore } from '../tab';
import { clearAuthStorage, getToken, setTokenCookie } from './shared';

export const useAuthStore = defineStore(SetupStoreId.Auth, () => {
  const route = useRoute();
  const authStore = useAuthStore();
  const routeStore = useRouteStore();
  const tabStore = useTabStore();
  const { toLogin, redirectFromLogin } = useRouterPush(false);
  const { loading: loginLoading, startLoading, endLoading } = useLoading();

  const token = ref(getToken());

  const userInfo: Api.Auth.UserInfo = reactive({
    user_id: '',
    user_name: '',
    roles: [],
    buttons: []
  });

  /** is super role in static route */
  const isStaticSuper = computed(() => {
    const { VITE_AUTH_ROUTE_MODE, VITE_STATIC_SUPER_ROLE } = import.meta.env;

    return VITE_AUTH_ROUTE_MODE === 'static' && userInfo.roles.includes(VITE_STATIC_SUPER_ROLE);
  });

  /** Is login */
  const isLogin = computed(() => Boolean(token.value));

  /** Reset auth store */
  async function resetStore() {
    recordUserId();

    clearAuthStorage();

    authStore.$reset();

    if (!route.meta.constant) {
      await toLogin();
    }

    tabStore.cacheTabs();
    routeStore.resetStore();
  }

  /** Record the user ID of the previous login session Used to compare with the current user ID on next login */
  function recordUserId() {
    if (!userInfo.user_id) {
      return;
    }

    // Store current user ID locally for next login comparison
    localStg.set('lastLoginUserId', userInfo.user_id);
  }

  /**
   * Check if current login user is different from previous login user If different, clear all tabs
   *
   * @returns {boolean} Whether to clear all tabs
   */
  function checkTabClear(): boolean {
    if (!userInfo.user_id) {
      return false;
    }

    const lastLoginUserId = localStg.get('lastLoginUserId');

    // Clear all tabs if current user is different from previous user
    if (!lastLoginUserId || lastLoginUserId !== userInfo.user_id) {
      localStg.remove('globalTabs');
      tabStore.clearTabs();

      localStg.remove('lastLoginUserId');
      return true;
    }

    localStg.remove('lastLoginUserId');
    return false;
  }

  /**
   * Login
   *
   * @param userName User name
   * @param password Password
   * @param [redirect=true] Whether to redirect after login. Default is `true`
   */
  async function login(userName: string, password: string, redirect = true) {
    startLoading();

    const { data, error } = await fetchLogin(userName, password);
    // console.log("login", data, error);
    if (error) {
      window.$notification?.error({
        title: "登陆错误",
        content:  error?.message || "",
        duration: 4500
      });
      resetStore();
      return;
    }

    localStg.set('token', data?.token??"");
    localStg.set('refreshToken', data?.token??"");
    setTokenCookie(data?.token??"");
    localStorage.setItem('userInfo', JSON.stringify(data));

    Object.assign(userInfo, data);


    if (!error) {
      const pass = await loginByToken(data?.token??"");

      if (pass) {
        // Check if the tab needs to be cleared
        // const isClear = checkTabClear();
        // let needRedirect = redirect;

      //   if (isClear) {
      //     // If the tab needs to be cleared,it means we don't need to redirect.
      //     needRedirect = false;
      //   }
      //   await redirectFromLogin(needRedirect);

        window.$notification?.success({
          title: $t('page.login.common.loginSuccess'),
          content: $t('page.login.common.welcomeBack', { userName: data?.username??"" }),
          duration: 4500
        });
        if (userInfo.roles.includes('1') || userInfo.roles.includes('2')) {
          window.location.href="/home"
        } else if (userInfo.roles.includes('4')) {
          window.location.href="/workflow"
        }else{
          window.location.href="/faults"
        }

      }else{
        window.$notification?.error({
          title: "登陆错误",
          content:  "登陆错误",
          duration: 4500
        });
        // resetStore();
      }
    } else {
      console.log("login error", error);
      // resetStore();
    }
    endLoading();
  }

  async function loginByToken(loginToken: string) {
    // 1. stored in the localStorage, the later requests need it in headers
    localStg.set('token', loginToken);
    localStg.set('refreshToken', loginToken);
    setTokenCookie(loginToken);

    // 2. get user info
    const pass = await getUserInfo();

    if (pass) {
      token.value = loginToken;

      return true;
    }

    return false;
  }

  async function getUserInfo() {
    const { data: info, error } = await fetchGetUserInfo();

    if (!error) {
      // update store
      Object.assign(userInfo, info);

      return true;
    }

    return false;
  }

  async function initUserInfo() {

    const hasToken = getToken();

    if (hasToken) {
      const pass = await getUserInfo();

      if (!pass) {
        resetStore();
      }
    }
  }

  return {
    token,
    userInfo,
    isStaticSuper,
    isLogin,
    loginLoading,
    resetStore,
    login,
    initUserInfo
  };
});
