<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('compute.text_513')}}</div>
    <div slot="body">
      <dialog-selected-tips :name="$t('dictionary.host')" :count="params.data.length" :action="$t('compute.text_513')" />
      <dialog-table :data="params.data" :columns="params.columns.slice(0, 2)" />
       <a-form
        :form="form.fc">
        <a-form-item :label="$t('compute.text_542')" v-bind="formItemLayout">
          <a-input-number v-decorator="decorators.cpu_cmtbound" :min="0" :step="0.1" />
        </a-form-item>
        <a-form-item :label="$t('compute.text_543')" v-bind="formItemLayout">
          <a-input-number v-decorator="decorators.mem_cmtbound" :min="0" :max="1" :step="0.1" />
          <div style="font-size:12px" class="add-desc">{{$t('compute.text_544')}}</div>
        </a-form-item>
      </a-form>
    </div>
    <div slot="footer">
      <a-button type="primary" @click="handleConfirm" :loading="loading">{{ $t('dialog.ok') }}</a-button>
      <a-button @click="cancelDialog">{{ $t('dialog.cancel') }}</a-button>
    </div>
  </base-dialog>
</template>

<script>
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'

export default {
  name: 'HostAdjustOversoldRatioDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      scope: this.$store.getters.scope,
      form: {
        fc: this.$form.createForm(this),
      },
      decorators: {
        cpu_cmtbound: [
          'cpu_cmtbound',
          {
            initialValue: this.params.data[0].cpu_cmtbound,
            rules: [
              {
                required: true,
                message: this.$t('compute.text_545'),
              },
            ],
          },
        ],
        mem_cmtbound: [
          'mem_cmtbound',
          {
            initialValue: this.params.data[0].mem_cmtbound,
            rules: [
              {
                required: true,
                message: this.$t('compute.text_546'),
              },
            ],
          },
        ],
      },
      formItemLayout: {
        wrapperCol: {
          span: 20,
        },
        labelCol: {
          span: 4,
        },
      },
    }
  },
  methods: {
    doUpdate (data) {
      const ids = this.params.data.map(item => item.id)
      return this.params.onManager('batchUpdate', {
        id: ids,
        managerArgs: {
          data,
        },
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        let values = await this.form.fc.validateFields()
        values = {
          ...values,
          // name: this.params.data[0].name,
        }
        await this.doUpdate(values)
        this.loading = false
        this.cancelDialog()
        this.params.refresh()
      } catch (error) {
        this.loading = false
      }
    },
  },
}
</script>
