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
    path: '/dataclean',
    component: Layout,
    redirect: '/dataclean/list',
    name: 'DataClean',
    meta: {
      title: '数据集成',
      icon: 'collect'
    },
    roles: ['admin', 'editor'],
    children: [
      {
        path: '/realtime/collection',
        component: () => import('@/views/dataclean/realtime/realtime.vue'),
        name: 'COLLECTION',
        meta: { title: 'CDC实时归集', icon: 'real-sync' },
        roles: ['admin', 'editor']
      },
      {
        path: '/dataclean/flow',
        component: () => import('@/views/dataclean/flow/flow'),
        name: 'FLOW',
        meta: { title: '清洗流程设计', icon: 'clean-flow' },
        roles: ['admin', 'editor']
      },
      {
        path: '/dataclean/task',
        component: () => import('@/views/dataclean/task/task'),
        name: 'TASK',
        meta: { title: '清洗任务管理', icon: 'clean-task' },
        hidden: false,
        roles: ['admin', 'editor']
      },
      {
        path: '/dataclean/task-log',
        component: () => import('@/views/dataclean/task-log/index'),
        name: 'TASK_LOG',
        meta: { title: '清洗任务日志', icon: 'el-icon-document' },
        hidden: false,
        roles: ['admin', 'editor']
      }
    ]
  },

  {
    path: '/qualiteval',
    component: Layout,
    redirect: '/qualiteval/model',
    alwaysShow: true,
    name: 'Qualiteval',
    meta: {
      title: '质量评测',
      icon: 'quality_eval',
      roles: ['admin', 'editor']
    },
    children: [
      {
        path: 'model/detail/:id',
        component: () => import('@/views/qualiteval/ModelDetail.vue'),
        name: 'QualitevalModelDetail',
        hidden: true,
        meta: {
          title: '评测模型详情',
          icon: 'el-icon-collection',
          noCache: true,
          roles: ['admin', 'editor']
        }
      },
      {
        path: 'report/:modelId',
        component: () => import('@/views/qualiteval/ReportSummary.vue'),
        name: 'QualitevalReportByModel',
        hidden: true,
        meta: {
          title: '质检报告',
          icon: 'count',
          noCache: true,
          roles: ['admin', 'editor']
        }
      },
      {
        path: 'issues/:resultId',
        component: () => import('@/views/qualiteval/IssueList.vue'),
        name: 'QualitevalIssues',
        hidden: true,
        meta: {
          title: '问题数据',
          icon: 'el-icon-warning-outline',
          noCache: true,
          roles: ['admin', 'editor']
        }
      },
      {
        path: 'model',
        component: () => import('@/views/qualiteval/ModelList.vue'),
        name: 'QualitevalModel',
        meta: {
          title: '质检模型',
          icon: 'quality_model',
          roles: ['admin', 'editor']
        }
      },
      {
        path: 'rule',
        component: () => import('@/views/qualiteval/RuleList.vue'),
        name: 'QualitevalRule',
        meta: {
          title: '质检规则',
          icon: 'el-icon-s-operation',
          roles: ['admin', 'editor']
        }
      },
      {
        path: 'task',
        component: () => import('@/views/qualiteval/TaskList.vue'),
        name: 'QualitevalTask',
        meta: {
          title: '质检任务',
          icon: 'quality_task',
          roles: ['admin', 'editor']
        }
      },
      {
        path: 'report',
        component: () => import('@/views/qualiteval/ReportSummary.vue'),
        name: 'QualitevalReport',
        meta: {
          title: '质检报告',
          icon: 'count',
          noCache: true,
          roles: ['admin', 'editor']
        }
      },
      {
        path: 'issues',
        component: () => import('@/views/qualiteval/IssueList.vue'),
        name: 'QualitevalIssueHub',
        meta: {
          title: '问题数据',
          icon: 'el-icon-warning-outline',
          noCache: true,
          roles: ['admin', 'editor']
        }
      }
    ]
  },
  {
    path: '/agent-manage',
    component: Layout,
    redirect: '/agent-manage/knowledge-base',
    alwaysShow: true,
    name: 'AgentManage',
    meta: {
      title: 'Agent管理',
      icon: 'agent',
      roles: ['admin', 'editor']
    },
    children: [
      {
        path: 'knowledge-base',
        component: () => import('@/views/knowledgebase/index.vue'),
        name: 'KnowledgeBaseIndex',
        meta: {
          title: '知识库管理',
          icon: 'knowledge',
          roles: ['admin', 'editor']
        }
      }
    ]
  },

  {
    path: '/knowledge-base',
    redirect: '/agent-manage/knowledge-base',
    hidden: true
  },

  {
    path: '/usercenter',
    component: Layout,
    redirect: '/usercenter/user-manage',
    alwaysShow: true,
    name: 'UserCenter',
    meta: { title: '用户中心', icon: 'el-icon-user', roles: ['admin'] },
    children: [
      {
        path: 'user-manage',
        component: () => import('@/views/usercenter/user-manage.vue'),
        name: 'UserManage',
        meta: {
          title: '用户管理',
          icon: 'el-icon-user',
          roles: ['admin']
        }
      },
      {
        path: 'contact-manage',
        component: () => import('@/views/usercenter/contact-manage.vue'),
        name: 'ContactManage',
        meta: {
          title: '联系人管理',
          icon: 'el-icon-phone-outline',
          roles: ['admin']
        }
      }
    ]
  },

  {
    path: '/basic-config',
    component: Layout,
    redirect: '/basic-config/dataclean',
    alwaysShow: true,
    name: 'BasicConfig',
    meta: {
      title: '基础配置',
      icon: 'el-icon-setting',
      roles: ['admin', 'editor']
    },
    children: [
      {
        path: 'dataclean',
        component: () => import('@/views/dataclean/rule/rule-list'),
        name: 'DataCleanRuleList',
        meta: {
          title: '清洗转换规则',
          icon: 'el-icon-collection',
          roles: ['admin', 'editor']
        }
      },
      {
        path: 'formula',
        component: () => import('@/views/dataclean/formula/formula-list'),
        name: 'DataCleanFormulaList',
        meta: {
          title: '业务字段函数库',
          icon: 'microscopic',
          roles: ['admin', 'editor']
        }
      },
      {
        path: 'qualiteval-rule',
        redirect: (to) => ({ path: '/qualiteval/rule', query: to.query }),
        name: 'QualitevalRuleLegacy',
        hidden: true,
        meta: {
          title: '质检规则',
          icon: 'el-icon-s-operation',
          roles: ['admin', 'editor']
        }
      }
    ]
  },

  {
    path: '/basic-config/dataclean/edit',
    component: Layout,
    hidden: true,
    children: [
      {
        path: '',
        component: () => import('@/views/dataclean/rule/rule-edit'),
        name: 'DataCleanRuleEdit',
        meta: {
          title: '清洗转换规则配置',
          noCache: true,
          roles: ['admin', 'editor']
        }
      }
    ]
  },

  {
    path: '/basic-config/formula/edit',
    component: Layout,
    hidden: true,
    children: [
      {
        path: '',
        component: () => import('@/views/dataclean/formula/formula-edit'),
        name: 'DataCleanFormulaEdit',
        meta: {
          title: '微观计算公式配置',
          noCache: true,
          roles: ['admin', 'editor']
        }
      }
    ]
  },

  {
    path: '/agent-assistant',
    component: () => import('@/views/agentService/index.vue'),
    name: 'AIAgentAssistant',
    meta: {
      title: '智能小助手',
      icon: 'el-icon-service',
      roles: ['admin', 'editor']
    },
    hidden: true
  },
  // 404 page must be placed at the end !!!
  { path: '*', redirect: '/404', hidden: true },

  {
    path: '/dataclean/flowChart',
    component: () => import('@/views/dataclean/flow/flowChart.vue'),
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
