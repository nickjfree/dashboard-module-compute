<template>
  <div>
    <page-header :title="$t('compute.text_18')" :tabs="cloudEnvOptions" :current-tab.sync="cloudEnv" />
    <a-form
      class="mt-3"
      :form="form.fc">
      <a-form-item :label="$t('compute.text_297', [$t('dictionary.project')])" class="mb-0" v-bind="formItemLayout">
        <domain-project :fc="form.fc" :decorators="{ project: decorators.project, domain: decorators.domain }" />
      </a-form-item>
      <area-selects
        class="mb-0"
        ref="areaSelects"
        :wrapperCol="formItemLayout.wrapperCol"
        :labelCol="formItemLayout.labelCol"
        :names="areaselectsName"
        :cloudregionParams="param.region"
        :zoneParams="param.zone"
        :isRequired="true"
        :region.sync="regionList" />
      <a-form-item :label="$t('compute.text_228')" v-bind="formItemLayout">
        <a-input v-decorator="decorators.name" :placeholder="$t('validator.resourceCreateName')" />
      </a-form-item>
      <a-form-item :label="$t('compute.text_100')" required v-bind="formItemLayout">
        <a-row>
          <a-col :span="6" class="mr-2">
            <a-select v-decorator="decorators.backend" @change="__newStorageChange">
              <a-select-option v-for="item in storageOpts" :key="item.value">
                <div class="d-flex">
                  <span class="text-truncate flex-fill mr-2" :title="item.label">{{ item.label }}</span>
                </div>
              </a-select-option>
            </a-select>
          </a-col>
          <a-col :span="3">
            <a-input-number :min="minDiskData" :max="maxDiskData" :step="step" v-decorator="decorators.size" /> GB
          </a-col>
        </a-row>
      </a-form-item>
      <a-form-item :label="$t('compute.text_15')" required v-bind="formItemLayout" v-show="cloudproviderData.length > 1 && cloudEnv === 'public'">
        <base-select
          class="w-50"
          v-decorator="decorators.cloudprovider"
          resource="cloudproviders"
          :params="cloudproviderParams"
          :isDefaultSelect="true"
          :showSync="true"
          :select-props="{ placeholder: $t('compute.text_149') }"
          :resList.sync="cloudproviderData" />
      </a-form-item>
    </a-form>
    <page-footer>
      <div slot="right">
        <a-button class="float-right" type="primary" @click="handleConfirm" :loading="loading">{{ $t('common_258') }}</a-button>
      </div>
    </page-footer>
  </div>
</template>

<script>
import * as R from 'ramda'
import { mapGetters } from 'vuex'
import * as CommonConstants from '../../../constants'
import AreaSelects from '@/sections/AreaSelects'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
import { isRequired } from '@/utils/validate'
import i18n from '@/locales'
import DomainProject from '@/sections/DomainProject'
import { PROVIDER_MAP } from '@/constants'
import { getCloudEnvOptions } from '@/utils/common/hypervisor'

export default {
  name: 'DiskCreate',
  components: {
    AreaSelects,
    DomainProject,
  },
  mixins: [DialogMixin, WindowsMixin],
  data () {
    const cloudEnvOptions = getCloudEnvOptions('compute_engine_brands', true)
    const queryType = this.$route.query.type
    let cloudEnv = queryType === 'idc' ? 'onpremise' : this.$route.query.type
    let routerQuery = this.$route.query.type
    if (!cloudEnvOptions.find(val => val.key === cloudEnv)) {
      cloudEnv = cloudEnvOptions[0].key
      routerQuery = cloudEnv === 'onpremise' ? 'idc' : cloudEnv
    }
    return {
      loading: false,
      cloudEnvOptions,
      cloudEnv,
      routerQuery,
      form: {
        fc: this.$form.createForm(this, {
          onValuesChange: (props, values) => {
            if (values.domain && values.domain.key) {
              this.form.fd.domain = values.domain.key
            }
            if (values.project && values.project.key) {
              this.form.fd.project = values.project.key
            }
            if (values.hasOwnProperty('zone')) {
              if (values.zone) {
                this.fetchStorageList(values.zone)
                this.form.fd.zone = values.zone
              } else {
                this.storageOpts = []
                this.form.fc.resetFields(['backend'])
              }
            }
            if (values.cloudregion) {
              this.form.fd.cloudregion = values.cloudregion
            }
          },
        }),
        fd: {
          domain: '',
          project: '',
          cloudregion: '',
          zone: '',
        },
      },
      decorators: {
        domain: [
          'domain',
          {
            rules: [
              { validator: isRequired(), message: i18n.t('rules.domain'), trigger: 'change' },
            ],
          },
        ],
        project: [
          'project',
          {
            rules: [
              { validator: isRequired(), message: i18n.t('rules.project'), trigger: 'change' },
            ],
          },
        ],
        name: [
          'name',
          {
            validateFirst: true,
            rules: [
              { required: true, message: this.$t('compute.text_210') },
              { validator: this.$validate('resourceCreateName') },
            ],
          },
        ],
        backend: [
          'backend',
          {
            rules: [
              { required: true, message: this.$t('compute.text_411') },
            ],
          },
        ],
        storage_id: [
          'storage_id',
          {
            rules: [
              { required: true, message: this.$t('compute.text_411') },
            ],
          },
        ],
        size: [
          'size',
          {
            initialValue: 10,
            rules: [
              { required: true },
            ],
          },
        ],
        cloudprovider: [
          'cloudprovider',
          {
            rules: [
              { required: true, message: this.$t('common_588') },
            ],
          },
        ],
      },
      formItemLayout: {
        wrapperCol: {
          span: 21,
        },
        labelCol: {
          span: 3,
        },
      },
      storageOpts: [],
      storageItem: {},
      maxDiskData: 2048,
      minDiskData: 1,
      step: 10,
      cloudproviderData: [],
      regionList: {},
    }
  },
  computed: {
    ...mapGetters(['isAdminMode', 'scope', 'userInfo']),
    currentCloudregion () {
      return this.regionList[this.form.fd.cloudregion]
    },
    provider () { // 向外提供的，通过 refs 获取
      if (this.currentCloudregion && this.currentCloudregion.provider) {
        return this.currentCloudregion.provider.toLowerCase()
      }
      return ['kvm', 'esxi'] // 没有 provider 肯定是 kvm 或者 esxi 的cloudregion
    },
    diskType () {
      return this.cloudEnv
    },
    storageLabel () {
      if (['idc', 'private'].includes(this.diskType)) {
        return this.$t('compute.text_380')
      }
      return this.$t('compute.text_396')
    },
    param () {
      const project_domain = { project_domain: this.form.fd.domain || this.userInfo.domain.id }
      if (this.diskType === 'private') {
        return {
          zone: {
            usable: true,
            show_emulated: true,
            order_by: 'created_at',
            order: 'asc',
            ...project_domain,
          },
          region: {
            usable: true,
            cloud_env: 'private',
            show_emulated: true,
            ...project_domain,
          },
        }
      } else if (this.diskType === 'public') {
        return {
          zone: {
            usable: true,
            show_emulated: true,
            order_by: 'created_at',
            order: 'asc',
            ...project_domain,
          },
          region: {
            usable: true,
            cloud_env: 'public',
            ...project_domain,
          },
        }
      }
      if (this.isAdminMode) {
        return {
          zone: {
            ...project_domain,
          },
          region: {
            usable: true,
            cloud_env: 'onpremise',
            ...project_domain,
          },
        }
      }
      return {
        zone: {
          ...project_domain,
        },
        region: {
          usable: true,
          cloud_env: 'onpremise',
          scope: this.scope,
        },
      }
    },
    areaselectsName () {
      if (this.diskType === 'private' || this.diskType === 'onpremise') {
        return ['cloudregion', 'zone']
      }
      return ['city', 'provider', 'cloudregion', 'zone']
    },
    cloudproviderParams () {
      const { cloudregion, domain: project_domain, zone } = this.form.fd
      const params = {
        limit: 0,
        enabled: true,
        'filter.0': 'status.equals("connected")',
        'filter.1': 'health_status.equals("normal")',
        cloudregion,
        project_domain,
        zone,
      }
      return params
    },
  },
  watch: {
    cloudEnv (val) {
      this.$refs.areaSelects.fetchs(['city', 'provider', 'cloudregion', 'zone'])
    },
    'form.fd.domain' (newValue, oldValue) {
      if (newValue !== oldValue) {
        this.$refs.areaSelects.fetchs(this.areaselectsName)
      }
    },
  },
  provide () {
    return {
      form: this.form,
    }
  },
  methods: {
    fetchStorageList (zoneId) {
      const params = { show_emulated: true, scope: this.scope }
      this.storageOpts = []
      new this.$Manager('capability').list({ ctx: [['zones', zoneId]], params })
        .then(({ data }) => {
          try {
            let storageTypes = data.data_storage_types
            // !!! 后端不好隐藏 local_ssd 存储类型，前端暂时隐藏
            if (this.currentCloudregion.provider.toLowerCase() === 'qcloud') storageTypes = storageTypes.filter(val => !~val.indexOf('local_ssd'))
            if (this.currentCloudregion.provider.toLowerCase() === 'ucloud') {
              storageTypes = storageTypes.filter(val => {
                if (!~val.indexOf('LOCAL_NORMAL')) return false
                if (!~val.indexOf('LOCAL_SSD')) return false
                return true
              })
            }
            this.storageOpts = storageTypes.map((item) => {
              const type = item.split('/')[0]
              const provider = Array.isArray(this.provider) ? this.provider[0] : this.provider
              const storageType = CommonConstants.STORAGE_TYPES[provider][type]
              const getLabel = (type) => { return type.includes('rbd') ? 'Ceph' : type }
              return {
                value: type,
                label: storageType ? storageType.label : getLabel(type),
              }
            })
            if (this.diskType === 'idc') {
              this.storageOpts = this.storageOpts.filter((item) => {
                return item.value !== 'local'
              })
            } else if (this.diskType === 'private') {
              this.storageOpts = this.storageOpts.filter((item) => {
                return item.value !== 'nova'
              })
            }
            this.form.fc.setFieldsValue({ backend: '' })
            if (this.storageOpts.length > 0) {
              if (this.cloudEnv === 'onpremise') {
                this.storageOpts = this.storageOpts.filter(item => { return item.value !== 'local' })
              }
              this.form.fc.setFieldsValue({ backend: this.storageOpts[0].value })
              this.__newStorageChange(this.storageOpts[0].value)
            }
          } catch (error) {
            throw new Error(this.$t('common_589') + error)
          }
        })
    },
    validateForm () {
      return new Promise((resolve, reject) => {
        this.form.fc.validateFields((err, values) => {
          if (!err) {
            resolve(values)
          } else {
            reject(err)
          }
        })
      })
    },
    doCreate (data) {
      return new this.$Manager('disks').create({ data })
    },
    async handleConfirm () {
      this.loading = true
      try {
        let values = await this.validateForm()
        const { project, domain, cloudregion, zone, ...rest } = values
        const oProvider = PROVIDER_MAP[this.currentCloudregion.provider]
        const provider = Array.isArray(this.provider) ? this.provider[0] : this.provider
        values = {
          ...rest,
          hypervisor: oProvider ? oProvider.hypervisor : provider,
          size: values.size * 1024,
          project_domain: (domain && domain.key) || this.userInfo.projectDomainId,
          project_id: (project && project.key) || this.userInfo.projectId,
          prefer_region: cloudregion,
          prefer_zone: zone,
        }
        Reflect.deleteProperty(values, 'cloudregion')
        Reflect.deleteProperty(values, 'zone')
        Reflect.deleteProperty(values, 'provider')
        await this.doCreate(values)
        this.$message.success(this.$t('k8s.text_184'))
        this.$router.push('/disk')
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    },
    _translateStorageOps (data) {
      const findStorageProvider = optItem => {
        const storageName = optItem.name ? `(${optItem.name})` : ''
        let storageType = optItem.storage_type
        let storageProvider = {}
        if (R.is(Array, this.provider)) {
          this.provider.forEach(hypervisor => { // 将 kvm 和 esxi 的存储类型合一
            Object.assign(storageProvider, CommonConstants.STORAGE_TYPES[hypervisor])
          })
        } else {
          storageProvider = CommonConstants.STORAGE_TYPES[this.provider]
        }
        if (storageProvider[storageType.toLowerCase()]) {
          storageType = storageType.toLowerCase()
        } else if (storageProvider[storageType.toUpperCase()]) {
          storageType = storageType.toUpperCase()
        }
        return {
          storageName,
          storageType,
          storageProvider,
        }
      }
      // 过滤掉不支持创建的云硬盘的存储类型
      const conCreateCloud = data.filter(v => {
        const { storageProvider, storageType } = findStorageProvider(v)
        if (storageType === 'nova') return false
        if (storageType && storageProvider && !R.isEmpty(storageProvider) && storageProvider[storageType]) {
          return !storageProvider[storageType].unCreateCloud
        }
        // 说明支持自定义
        if (CommonConstants.CUSTOM_STORAGE_TYPES.includes(this.provider)) {
          return true
        }
        return false
      })
      return conCreateCloud.map(v => {
        const { storageName, storageType, storageProvider } = findStorageProvider(v)
        let label = v.name
        try {
          if (storageProvider[storageType]) {
            label = storageProvider[storageType].label
          } else {
            label = storageProvider[storageType.toLowerCase()].label
          }
        } catch (error) {
          console.warn(this.$t('compute.text_413', [this.provider, storageType]))
        }
        return {
          label: `${label}${storageName}`,
          value: v.id,
          ...v,
        }
      })
    },
    __storageChange (storageId) {
      const item = this.storageOpts.find(v => v.value === storageId)
      this.storageItem = item
      const provider = item.provider.toLowerCase()
      try {
        const storageItem = CommonConstants.STORAGE_TYPES[provider]
        if (storageItem && storageItem[item.storage_type]) {
          this.minDiskData = CommonConstants.STORAGE_TYPES[provider][item.storage_type].min
          this.maxDiskData = CommonConstants.STORAGE_TYPES[provider][item.storage_type].max
        } else {
          this.minDiskData = 1
          this.maxDiskData = 2048
        }
      } catch (error) {
        console.warn(this.$t('compute.text_413', [CommonConstants.STORAGE_TYPES[provider], item.storage_type]))
      }
      this.form.fc.setFieldsValue({ size: 10 })
      const size = this.form.fc.getFieldValue('size')
      if (size > this.maxDiskData) { // 如果当前容量大于当前集群的最大值，那么取最大值
        this.form.fc.setFieldsValue({ size: this.maxDiskData })
      } else if (size < this.minDiskData) { // 如果当前容量小于当前集群的最大值，那么取最小值
        this.form.fc.setFieldsValue({ size: this.minDiskData })
      }
    },
    __newStorageChange (val) {
      const item = this.storageOpts.find(v => v.value === val)
      this.storageItem = item
      try {
        const storageItem = CommonConstants.STORAGE_TYPES[this.provider]
        if (storageItem && storageItem[item.value]) {
          this.minDiskData = CommonConstants.STORAGE_TYPES[this.provider][item.value].min
          this.maxDiskData = CommonConstants.STORAGE_TYPES[this.provider][item.value].max
        } else {
          this.minDiskData = 1
          this.maxDiskData = 2048
        }
      } catch (error) {
        console.warn(this.$t('compute.text_413', [CommonConstants.STORAGE_TYPES[this.provider], item.storage_type]))
      }
      this.form.fc.setFieldsValue({ size: 10 })
      const size = this.form.fc.getFieldValue('size')
      if (size > this.maxDiskData) { // 如果当前容量大于当前集群的最大值，那么取最大值
        this.form.fc.setFieldsValue({ size: this.maxDiskData })
      } else if (size < this.minDiskData) { // 如果当前容量小于当前集群的最大值，那么取最小值
        this.form.fc.setFieldsValue({ size: this.minDiskData })
      }
    },
  },
}
</script>
