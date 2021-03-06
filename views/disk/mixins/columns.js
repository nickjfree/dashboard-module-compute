import { MEDIUM_MAP } from '../../../constants'
import { getUnusedTableColumn } from '../utils/columns'
import {
  getNameDescriptionTableColumn,
  getBrandTableColumn,
  getStatusTableColumn,
  getProjectTableColumn,
  getTimeTableColumn,
  getCopyWithContentTableColumn,
  getRegionTableColumn,
  getBillingTypeTableColumn,
  getTagTableColumn,
  getAccountTableColumn,
} from '@/utils/common/tableColumn'
import { sizestr } from '@/utils/utils'
import i18n from '@/locales'

export default {
  created () {
    this.columns = [
      getNameDescriptionTableColumn({
        onManager: this.onManager,
        hideField: true,
        formRules: [
          { required: true, message: i18n.t('compute.text_210') },
          { validator: this.$validate('resourceCreateName') },
        ],
        slotCallback: row => {
          return (
            <side-page-trigger onTrigger={ () => this.handleOpenSidepage(row) }>{ row.name }</side-page-trigger>
          )
        },
      }),
      getTagTableColumn({ onManager: this.onManager, needExt: true, resource: 'disk', columns: () => this.columns }),
      {
        field: 'disk_size',
        title: i18n.t('compute.text_397'),
        minWidth: 50,
        formatter: ({ cellValue }) => {
          return sizestr(cellValue, 'M', 1024)
        },
      },
      {
        field: 'disk_format',
        title: i18n.t('compute.text_398'),
        width: 70,
      },
      {
        field: 'disk_type',
        title: i18n.t('compute.text_381'),
        width: 70,
        formatter: ({ cellValue }) => {
          return cellValue === 'sys' ? i18n.t('compute.text_49') : i18n.t('compute.text_50')
        },
      },
      getUnusedTableColumn(),
      {
        field: 'guest',
        title: this.$t('dictionary.server'),
        minWidth: 100,
        showOverflow: 'ellipsis',
        slots: {
          default: ({ row }, h) => {
            return [
              <div class='text-truncate'>
                {row.guest}
                {row.guest_status ? <status status={ row.guest_status } statusModule='server'/> : ''}
              </div>,
            ]
          },
        },
      },
      getCopyWithContentTableColumn({ field: 'storage', title: i18n.t('compute.text_392') }),
      getTimeTableColumn(),
      getBrandTableColumn(),
      getRegionTableColumn(),
      getBillingTypeTableColumn(),
      getStatusTableColumn({ statusModule: 'disk' }),
      getProjectTableColumn(),
      getAccountTableColumn(),
      {
        field: 'medium_type',
        title: i18n.t('compute.text_396'),
        width: 70,
        formatter: ({ cellValue }) => {
          return MEDIUM_MAP[cellValue]
        },
      },
    ]
  },
}
