//profile.js
import {IMyApp} from '../../app'
import {Client} from '../../utils/sdk'

const STATUS_NAME = {
  WAITING: '等待审核',
  PASSED: '审核通过',
  NOT_PASS: '未通过'
}
const STATUS_CLASS = {
  WAITING: 'waiting',
  PASSED: 'passed',
  NOT_PASS: 'not-pass'
}
const STATUS_VALUE_LIST = ['', 'PASSED', 'NOT_PASS', 'WAITING']

const app = getApp<IMyApp>()
const client: Client = app.globalData.client

let modalAction = null

Page({
  data: {
    data: {},
    modal: {
      on: false,
      cancel: false,
      title: '',
      content: ''
    }
  },

  onLoad() {
    client.auth.info.get({}, (ok, s, d) => {
      if(ok) {
        this.setData!({
          'data.card_id': d['username'].split(':')[1], 
          'data.name': d['name']
        })
      }else{
        this.modal('错误', '拉取数据时发生意料之外的错误。')
      }
    })
  },
  bindTapExit() {
    this.modal('退出登录', '确认要退出登录吗？', (yes: boolean) => {
      if(yes) {
        client.setToken(null)
        wx.reLaunch({url: '../index/index'})
      }
    })
  },
  modal(title: string, content: string, action: (yes: boolean) => void = null) {
    modalAction = action
    this.setData!({
      'modal.title': title,
      'modal.content': content,
      'modal.on': true,
      'modal.cancel': !!action
    })
  },
  bindConfirmModal() {
    this.setData!({'modal.on': false})
    if(modalAction != null) {
      modalAction(true)
      modalAction = null
    }
    
  },
  bindCancelModal() {
    this.setData!({'modal.on': false})
    if(modalAction != null) {
      modalAction(false)
      modalAction = null
    }
  }
})
