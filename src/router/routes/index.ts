import type { CustomRoute, ElegantConstRoute, ElegantRoute } from '@elegant-router/types';
import { generatedRoutes } from '../elegant/routes';
import { layouts, views } from '../elegant/imports';
import { transformElegantRoutesToVueRoutes } from '../elegant/transform';

/**
 * custom routes
 *
 * @link https://github.com/soybeanjs/elegant-router?tab=readme-ov-file#custom-route
 */
/** 场地详情路由 */
// 自定义路由只能使用 CustomRouteKey 类型的名称（'root' | 'not-found'）
// 详情页路由（repairrecordsdetail, sitedetail）属于 GeneratedRouteKey，由 elegant-router 自动生成
// 这些路由的配置在 src/router/elegant/routes.ts 中，路径转换在 build/plugins/router.ts 中
const customRoutes: CustomRoute[] = [
  // 这里只能添加 CustomRouteKey 类型的路由（'root' | 'not-found'）
  // 其他路由由 elegant-router 根据 views 目录结构自动生成
];

/** create routes when the auth route mode is static */
export function createStaticRoutes() {
  const constantRoutes: ElegantRoute[] = [];

  const authRoutes: ElegantRoute[] = [];

  [...customRoutes, ...generatedRoutes].forEach(item => {
    if (item.meta?.constant) {
      constantRoutes.push(item);
    } else {
      authRoutes.push(item);
    }
  });

  return {
    constantRoutes,
    authRoutes
  };
}

/**
 * Get auth vue routes
 *
 * @param routes Elegant routes
 */
export function getAuthVueRoutes(routes: ElegantConstRoute[]) {
  return transformElegantRoutesToVueRoutes(routes, layouts, views);
}
