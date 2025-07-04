<script setup lang="ts">
import { computed } from "vue";
import { clone } from "@PureAdmin/utils";
import { transformI18n } from "@/plugins/i18n";
import ElTreeLine from "@/components/ReTreeLine";
import { extractPathList, deleteChildren } from "@/utils/tree";
import { usePermissionStoreHook } from "@/store/modules/permission";

defineOptions({
  name: "LineTree"
});

const menusTree = clone(usePermissionStoreHook().wholeMenus, true);
const menusData = computed(() => {
  return deleteChildren(menusTree);
});
const expandedKeys = extractPathList(menusData.value);
const dataProps = {
  value: "uniqueId",
  children: "children"
};
</script>

<template>
  <el-card shadow="never">
    <template #header>
      <div class="card-header">
        <p class="font-medium">
          扩展 Elemenet Plus 的树形组件包括虚拟树组件，支持连接线
        </p>
        <el-link
          class="mt-2"
          href="https://github.com/pure-admin/vue-pure-admin/blob/main/src/views/able/line-tree.vue"
          target="_blank"
        >
          代码位置 src/views/able/line-tree.vue
        </el-link>
      </div>
    </template>

    <el-row :gutter="24">
      <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" class="mb-[20px]">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">普通树结构</div>
          </template>
          <div class="max-h-[550px] overflow-y-auto">
            <el-tree
              :data="menusData"
              :props="dataProps"
              show-checkbox
              default-expand-all
              node-key="uniqueId"
              :indent="30"
              ><template v-slot:default="{ node }">
                <el-tree-line :node="node" :showLabelLine="true">
                  <template v-slot:node-label>
                    <span class="text-sm">
                      {{ transformI18n(node.data.meta.title) }}
                    </span>
                  </template>
                </el-tree-line>
              </template>
            </el-tree>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">虚拟树结构</div>
          </template>
          <div class="max-h-[550px] overflow-y-auto">
            <el-tree-v2
              :data="menusData"
              :props="dataProps"
              show-checkbox
              :height="550"
              :default-expanded-keys="expandedKeys"
            >
              <template v-slot:default="{ node }">
                <el-tree-line
                  :node="node"
                  :treeData="menusData"
                  :showLabelLine="true"
                  :indent="30"
                >
                  <template v-slot:node-label>
                    <span class="text-sm">
                      {{ transformI18n(node.data.meta.title) }}
                    </span>
                  </template>
                </el-tree-line>
              </template>
            </el-tree-v2>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </el-card>
</template>
