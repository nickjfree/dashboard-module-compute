<template>
  <div class="mb-3" v-if="isShow">
    <a-alert type="info" class="mt-2">
      <div slot="message" class="d-flex">
        <div>{{ $t('common_567') }}：</div>
        <div>
          <a-tag
            v-for="(item, index) in statusErrorOpts"
            :key="index"
            :color="item.color"
            class="oc-pointer"
            @click="chooseStatusHandle(item)">
            {{ item.text}}({{ item.num }})
          </a-tag>
        </div>
      </div>
    </a-alert>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { uniqueOccurrences, uuid } from '@/utils/utils'
export default {
  name: 'ServerErrorStatusTab',
  props: {
    resource: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
  },
  data () {
    return {
      statusMap: {},
      statusErrorOpts: [],
      statusArr: [],
      isFirstLoad: true,
    }
  },
  computed: {
    ...mapGetters(['scope']),
    isShow () {
      const opts = this.statusErrorOpts.filter((item) => { return /fail/.test(item.val) })
      const sum = opts.reduce(function (acc, cur) {
        return acc + cur.num
      }, 0)
      return sum > 0
    },
    isHost () {
      return this.resource === 'hosts'
    },
  },
  created () {
    this.loadServersData()
    this.$bus.$on('ServerFilterChange', (val) => {
      const statusArr = val.status || []
      this.statusErrorOpts = this.statusErrorOpts.map((item) => {
        return {
          ...item,
          checked: statusArr.includes(item.val),
          color: statusArr.includes(item.val) ? 'red' : '',
        }
      })
    })
  },
  methods: {
    loadServersData () {
      const m = new this.$Manager(this.resource)
      const params = {
        scope: this.scope,
        limit: 0,
        $t: uuid(),
      }
      if (this.isHost) {
        params.baremetal = false
      }
      m.list({ params }).then((res) => {
        const { data } = res.data
        const statusArr = data.map((item) => { return item.status })
        const statusMap = uniqueOccurrences(statusArr)
        this.statusErrorOpts = []
        this.statusArr = []
        for (const k in statusMap) {
          this.statusArr.push(k)
          if (statusMap.hasOwnProperty(k) && /fail/.test(k)) {
            const num = statusMap[k]
            this.statusErrorOpts.push({
              color: '',
              text: this.$t(`status.${this.status}.${k}`),
              num: num,
              val: k,
              checked: false,
            })
          }
        }
        const statusErrorOpts = this.statusErrorOpts.map((item) => {
          return {
            ...item,
            num: statusMap[item.val] || 0,
          }
        })
        this.statusErrorOpts = statusErrorOpts
        const statusCheckArr = [...statusErrorOpts].filter((item) => { return item.checked && item.num > 0 }).map((item) => { return item.val })
        this.$emit('getStatusCheckArr', statusCheckArr, this.statusArr, this.isFirstLoad)
      }).catch((err) => {
        console.log(err)
        throw err
      })
    },
    chooseStatusHandle (item) {
      this.isFirstLoad = false
      if (!item.checked) {
        item.checked = true
        item.color = 'red'
      } else {
        item.checked = false
        item.color = ''
      }
      const statusCheckArr = [...this.statusErrorOpts].filter((item) => { return item.checked && item.num > 0 }).map((item) => { return item.val })
      this.$emit('getStatusCheckArr', statusCheckArr, this.statusArr, this.isFirstLoad)
    },
  },
}
</script>
