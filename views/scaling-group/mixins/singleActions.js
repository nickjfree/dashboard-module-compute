import expectStatus from '@/constants/expectStatus'
export default {
  created () {
    this.singleActions = [
      {
        label: '启用',
        permission: 'scalinggroups_perform_enable',
        action: obj => {
          this.createDialog('ScalingGroupEnable', {
            data: [obj],
            columns: this.columns,
            onManager: this.onManager,
          })
        },
        meta: (obj) => ({
          validate: !obj.enabled,
        }),
      },
      {
        label: '禁用',
        permission: 'scalinggroups_perform_disable',
        action: (obj) => {
          this.createDialog('ScalingGroupDisable', {
            data: [obj],
            columns: this.columns,
            onManager: this.onManager,
          })
        },
        meta: (obj) => {
          return {
            validate: obj.enabled,
          }
        },
      },
      {
        label: '删除',
        permission: 'scalinggroups_delete',
        action: (obj) => {
          this.createDialog('DeleteResDialog', {
            title: '删除',
            name: '弹性伸缩组',
            data: [obj],
            columns: this.columns,
            onManager: this.onManager,
            steadyStatus: Object.values(expectStatus.scalinggroup).flat(),
          })
        },
        meta: (obj) => {
          let tooltip = ''
          if (obj.enabled) {
            tooltip = '请先禁用弹性伸缩组'
          }
          if (obj.instance_number) {
            tooltip = '伸缩组内虚拟机不为空，请删除后重试'
          }
          return {
            validate: !obj.enabled && !obj.instance_number,
            tooltip,
          }
        },
      },
    ]
  },
}