<template>
  <monitor
    :time.sync="time"
    :timeGroup.sync="timeGroup"
    :monitorList="monitorList"
    :singleActions="singleActions"
    :loading="loading"
    @refresh="fetchData" />
</template>

<script>
import _ from 'lodash'
import { ONECLOUD_MONITOR, VMWARE_MONITOR, OTHER_MONITOR } from '@Compute/views/vminstance/constants'
import { metricItems } from '@Compute/views/node-alert/constants'
import influxdb from '@/utils/influxdb'
import { UNITS, autoComputeUnit } from '@/utils/utils'
import Monitor from '@/sections/Monitor'
import { HYPERVISORS_MAP } from '@/constants'
import WindowsMixin from '@/mixins/windows'

export default {
  name: 'VminstanceMonitorSidepage',
  components: {
    Monitor,
  },
  mixins: [WindowsMixin],
  props: {
    data: { // listItemData
      type: Object,
      required: true,
    },
  },
  data () {
    return {
      singleActions: [
        {
          label: this.$t('compute.text_382'),
          action: async obj => {
            const alertManager = new this.$Manager('nodealerts', 'v1')
            const { metric } = obj.constants
            const { data: { data = [] } } = await alertManager.list({
              params: {
                type: 'guest',
                node_id: this.data.id,
                metric,
              },
            })
            if (data && data.length) {
              if (data.length === 1) {
                this.createDialog('UpdateNodeAlert', {
                  data,
                  alertType: 'guest',
                  alertManager,
                  hypervisor: this.data.hypervisor,
                  metricOpts: this.metricOpts,
                })
              } else {
                throw Error(this.$t('compute.text_383'))
              }
            } else { // 新建报警
              this.createDialog('CreateNodeAlert', {
                alertType: 'guest',
                nodeId: this.data.id,
                metric,
                alertManager,
                hypervisor: this.data.hypervisor,
                metricOpts: this.metricOpts,
              })
            }
          },
        },
      ],
      loading: false,
      time: '1h',
      timeGroup: '1m',
      monitorList: [],
    }
  },
  computed: {
    hypervisor () {
      return this.data.hypervisor
    },
    monitorConstants () {
      if (this.hypervisor === HYPERVISORS_MAP.esxi.key) {
        return VMWARE_MONITOR
      } else if (this.hypervisor === HYPERVISORS_MAP.kvm.key) {
        return ONECLOUD_MONITOR
      } else {
        return OTHER_MONITOR
      }
    },
    serverId () {
      return this.data.id
    },
    sql () {
      return `time > now() - ${this.time} AND "vm_id"='${this.serverId}' GROUP BY time(${this.timeGroup}) FILL(none)`
    },
    hasMemMetric () {
      return this.hypervisor === HYPERVISORS_MAP.esxi.key
    },
    metricOpts () {
      const opts = [metricItems['vm_cpu.usage_active'], metricItems['vm_netio.bps_recv'], metricItems['vm_netio.bps_sent'], metricItems['vm_diskio.read_bps'], metricItems['vm_diskio.write_bps']]
      if (this.hasMemMetric) {
        opts.splice(1, 0, metricItems['vm_mem.used_percent'])
      }
      return opts
    },
  },
  created () {
    this.fetchData()
    this.fetchDataDebounce = _.debounce(this.fetchData, 500)
    this.baywatch(['time', 'timeGroup', 'data.id'], this.fetchDataDebounce)
  },
  methods: {
    async fetchData () {
      this.loading = true
      const resList = []
      for (let idx = 0; idx < this.monitorConstants.length; idx++) {
        const val = this.monitorConstants[idx]
        try {
          const { data: { results } } = await influxdb.get('', {
            params: {
              db: 'telegraf',
              q: `SELECT mean("${val.seleteItem}") as "${val.label}" FROM "telegraf"."30day_only"."${val.fromItem}" WHERE ${this.sql}`,
              epoch: 'ms',
            },
          })
          resList.push({ title: val.label, constants: val, ...results[0] })
          if (idx === this.monitorConstants.length - 1) {
            this.loading = false
            this.getMonitorList(resList)
          }
        } catch (error) {
          this.loading = false
          throw error
        }
      }
    },
    baywatch (props, watcher) {
      const iterator = function (prop) {
        this.$watch(prop, watcher)
      }
      props.forEach(iterator, this)
    },
    getMonitorList (resList) {
      this.monitorList = resList.map(result => {
        const { unit, transfer } = result.constants
        const isSizestrUnit = UNITS.includes(unit)
        let series = result.series
        if (!series) series = []
        if (isSizestrUnit || unit === 'bps') {
          series = series.map(serie => {
            return autoComputeUnit(serie, unit, transfer)
          })
        }
        return {
          title: result.title,
          series,
          constants: result.constants,
        }
      })
    },
  },
}
</script>
