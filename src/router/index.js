import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

/* Layout */
import Layout from '@/layout'

/* Router Modules */
// import componentsRouter from './modules/components'
// import chartsRouter from './modules/charts'
// import tableRouter from './modules/table'
// import nestedRouter from './modules/nested'

/**
 * constantRoutes
 * a base page that does not have permission requirements
 * all roles can be accessed
 */
export const constantRoutes = [
  {
    path: '/redirect',
    component: Layout,
    hidden: true,
    children: [
      {
        path: '/redirect/:path(.*)',
        component: () => import('@/views/redirect/index')
      }
    ]
  },
  {
    path: '/login',
    component: () => import('@/views/login/index'),
    hidden: true
  },
  {
    path: '/auth-redirect',
    component: () => import('@/views/login/auth-redirect'),
    hidden: true
  },
  {
    path: '/404',
    component: () => import('@/views/error-page/404'),
    hidden: true
  },
  {
    path: '/401',
    component: () => import('@/views/error-page/401'),
    hidden: true
  },
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        component: () => import('@/views/dashboard/index'),
        name: '首页',
        meta: { title: '平台概览', icon: 'overview', affix: true }
      }
    ]
  },
  {
    path: '/profile',
    component: Layout,
    redirect: '/profile/index',
    hidden: true,
    children: [
      {
        path: 'index',
        component: () => import('@/views/profile/index'),
        name: 'Profile',
        meta: { title: 'Profile', icon: 'user', noCache: true }
      }
    ]
  }
]

/**
 * asyncRoutes
 * the routes that need to be dynamically loaded based on user roles
 */
export const asyncRoutes = [
  {
    path: '/database',
    component: Layout,
    redirect: '/database/access',
    alwaysShow: true, // will always show the root menu
    name: 'Database',
    meta: {
      title: '数据源管理',
      icon: 'database',
      roles: ['admin', 'editor'] // you can set roles in root nav
    },
    children: [
      {
        path: 'access',
        component: () => import('@/views/database/database/database'),
        name: 'DatabaseAccess',
        meta: {
          title: '数据源接入',
          icon: 'el-icon-coin',
          roles: ['admin', 'editor'] // or you can only set roles in sub nav
        }
      },
      {
        path: 'collect',
        component: () => import('@/views/database/metadata/metadata'),
        name: 'DatabaseSync',
        meta: { title: '元数据采集', icon: 'metadata-collect' }
      },
      {
        path: 'resource',
        component: () => import('@/views/database/resource/resource'),
        name: 'Resource',
        meta: {
          title: '资源管理',
          icon: 'el-icon-folder',
          roles: ['admin', 'editor']
        }
      }
    ]
  },
  {
    path: '/etl',
    component: Layout,
    redirect: '/etl/list',
    name: 'ETL',
    meta: {
      title: '数据集成',
      icon: 'collect'
    },
    children: [
      {
        path: '/realtime/collection',
        component: () => import('@/views/error-page/401'),
        name: 'COLLECTION',
        meta: { title: '实时归集管理', icon: 'real-sync' }
      },
      {
        path: '/mttask',
        component: () => import('@/views/error-page/401'),
        name: 'MT_TASK',
        meta: {
          title: '多表归集管理',
          icon: 'multiple-tables',
          noCache: true,
          activeMenu: '/example/list'
        },
        hidden: false
      },
      {
        path: '/clean/flow',
        component: () => import('@/views/flow/flow'),
        name: 'FLOW',
        meta: { title: '清洗流程开发', icon: 'clean-flow' }
      },
      {
        path: '/clean/task',
        component: () => import('@/views/error-page/401'),
        name: 'TASK',
        meta: { title: '清洗任务管理', icon: 'clean-task' },
        hidden: false
      }
    ]
  },
  {
    path: '/excel',
    component: Layout,
    redirect: '/excel/export-excel',
    name: 'Excel',
    meta: {
      title: '监控预警',
      icon: 'monitor'
    },
    children: [
      {
        path: 'export-excel',
        component: () => import('@/views/excel/export-excel'),
        name: 'ExportExcel',
        meta: { title: 'Export Excel' }
      },
      {
        path: 'export-selected-excel',
        component: () => import('@/views/excel/select-excel'),
        name: 'SelectExcel',
        meta: { title: 'Export Selected' }
      },
      {
        path: 'export-merge-header',
        component: () => import('@/views/excel/merge-header'),
        name: 'MergeHeader',
        meta: { title: 'Merge Header' }
      },
      {
        path: 'upload-excel',
        component: () => import('@/views/excel/upload-excel'),
        name: 'UploadExcel',
        meta: { title: 'Upload Excel' }
      }
    ]
  },

  {
    path: '/usercenter',
    component: Layout,
    // redirect: '/zip/download',
    alwaysShow: true,
    name: 'usercenter',
    meta: { title: '用户中心', icon: 'el-icon-user' },
    children: [
      {
        path: 'role',
        component: () => import('@/views/permission/role'),
        name: 'RolePermission',
        meta: {
          title: '角色管理',
          icon: 'peoples',
          roles: ['admin']
        }
      }
    ]
  },

  {
    path: '/pdf',
    component: Layout,
    redirect: '/pdf/index',
    children: [
      {
        path: 'index',
        component: () => import('@/views/pdf/index'),
        name: 'PDF',
        meta: { title: '基础配置', icon: 'el-icon-setting' }
      }
    ]
  },

  // {
  //   path: '/theme',
  //   component: Layout,
  //   children: [
  //     {
  //       path: 'index',
  //       component: () => import('@/views/theme/index'),
  //       name: 'Theme',
  //       meta: { title: '主题设置', icon: 'theme' }
  //     }
  //   ]
  // },

  // 404 page must be placed at the end !!!
  { path: '*', redirect: '/404', hidden: true },

  {
    path: '/etl/flowChart',
    component: () => import('@/views/flow/flowChart.vue'),
    hidden: true
  }
]

const createRouter = () => new Router({
  // mode: 'history', // require service support
  scrollBehavior: () => ({ y: 0 }),
  routes: constantRoutes
})

const router = createRouter()

// Detail see: https://github.com/vuejs/vue-router/issues/1234#issuecomment-357941465
export function resetRouter() {
  const newRouter = createRouter()
  router.matcher = newRouter.matcher // reset router
}

export default router
