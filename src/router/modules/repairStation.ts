import { $t } from "@/plugins/i18n";
import { list } from "@/router/enums";

export default {
  path: "/repair",
  redirect: "/list/card",
  meta: {
    icon: "ri/list-check",
    title: "维修站管理",
    rank: list
  }
//   children: [
//     {
//       path: "/list/card",
//       name: "CardList",
//       component: () => import("@/views/list/card/index.vue"),
//       meta: {
//         icon: "ri/bank-card-line",
//         title: $t("menus.pureCardList"),
//         showParent: true
//       }
//     }
//   ]
} satisfies RouteConfigsTable;
