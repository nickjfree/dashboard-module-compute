import {
  getEnabledTableColumn,
  getNameDescriptionTableColumn,
  getStatusTableColumn,
} from '@/utils/common/tableColumn'
import { sizestr } from '@/utils/utils'
import i18n from '@/locales'

export default {
  created () {
    this.columns = [
      getNameDescriptionTableColumn({
        onManager: this.onManager,
        hideField: true,
        edit: false,
        slotCallback: row => {
          return (
            <side-page-trigger onTrigger={ () => this.handleOpenSidepage(row) }>{ row.name }</side-page-trigger>
          )
        },
      }),
      {
        field: 'cpu_core_count',
        title: i18n.t('compute.text_1051'),
        width: 100,
        formatter: ({ cellValue }) => {
          return cellValue + i18n.t('compute.text_167')
        },
      },
      {
        field: 'memory_size_mb',
        title: i18n.t('compute.text_1052'),
        width: 100,
        formatter: ({ cellValue }) => {
          return sizestr(cellValue, 'M', 1024)
        },
      },
      getStatusTableColumn({ statusModule: 'sku' }),
      {
        field: 'total_guest_count',
        title: this.$t('compute.text_699', [this.$t('dictionary.server')]),
        width: 120,
        slots: {
          default: ({ row }) => {
            if (row.total_guest_count <= 0) return row.total_guest_count
            return [<side-page-trigger name='SkuSidePage' id={row.id} tab='vminstance-list' vm={this}>{ row.total_guest_count }</side-page-trigger>]
          },
        },
      },
      getEnabledTableColumn(),
    ]
  },
}
