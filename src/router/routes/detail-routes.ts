import type { CustomRoute } from '@elegant-router/types';
import { layouts, views } from '../elegant/imports';
import { transformElegantRoutesToVueRoutes } from '../elegant/transform';

/**
 * 场地详情路由配置
 * 模仿 builtin.ts 中的路由结构
 */
export const SITE_DETAIL_ROUTE: CustomRoute = {
  name: 'root', // 注意：CustomRoute 只允许 'root' 和 'not-found'
  path: '/',
  redirect: '/miningsite', // 重定向到矿场列表
  meta: {
    title: '场地详情路由配置',
    constant: true
  }
};

/**
 * 维修明细详情路由配置
 * 模仿 builtin.ts 中的路由结构
 */
export const REPAIR_DETAIL_ROUTE: CustomRoute = {
  name: 'not-found',
  path: '/:pathMatch(.*)*',
  component: 'layout.blank$view.404',
  meta: {
    title: '维修详情路由配置',
    constant: true
  }
};

/**
 * 详情页路由配置说明：
 * 
 * 实际的详情页路由已经在 src/router/elegant/routes.ts 中自动生成：
 * 
 * 1. 场地详情路由：
 *    - name: 'sitedetail'
 *    - path: '/miningsite/:id/info'
 *    - component: 'layout.base$view.sitedetail'
 *    - meta: { hideInMenu: true, props: true }
 * 
 * 2. 维修明细详情路由：
 *    - name: 'repairrecordsdetail'
 *    - path: '/repairrecords/:id/detail'
 *    - component: 'layout.base$view.repairrecordsdetail'
 *    - meta: { hideInMenu: true, props: true }
 * 
 * 这些路由通过 elegant-router 的 routePathTransformer 函数
 * 在 build/plugins/router.ts 中配置了动态路径参数。
 */

/** 详情页路由集合 */
const detailRoutes: CustomRoute[] = [SITE_DETAIL_ROUTE, REPAIR_DETAIL_ROUTE];

/** 创建详情页 Vue 路由 */
export function createDetailVueRoutes() {
  return transformElegantRoutesToVueRoutes(detailRoutes, layouts, views);
}

/**
 * 使用说明：
 * 
 * 1. 由于 elegant-router 的类型限制，CustomRoute 只能使用 'root' 和 'not-found' 作为路由名称
 * 2. 实际的详情页路由应该通过 elegant-router 的自动生成机制来创建
 * 3. 如需自定义详情页路由，应该在 build/plugins/router.ts 的 routePathTransformer 中配置
 * 4. 本文件仅作为演示如何模仿 builtin.ts 的结构，实际项目中不需要使用
 */