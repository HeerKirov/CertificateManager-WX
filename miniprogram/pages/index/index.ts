//index.js
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
    login: {
      logined: null,
      username: '',
      password: ''
    },
    ui: {
      showMenu: false,
      filterStatus: 0,
    },
    data: [],
    filterStatusChoices: ['全部记录', '已通过审核', '未通过审核', '审核中'],
    bindStatusName: STATUS_NAME,
    bindStatusClass: STATUS_CLASS 
  },

  onLoad() {
    client.auth.info.get({}, (ok: boolean, s: number, d: any) => {
      if(ok && s === 200) {
        app.globalData.profile = {
          username: d['username'],
          userType: d['username'].split(':')[0],
          cardId: d['username'].split(':')[1],
          isStaff: d['is_staff'],
          isAuthenticated: true
        }
        this.setData!({'login.logined': true})
        this.requestForList()
      }else{
        this.setData!({'login.logined': false})
      }
    })
  },
  onShow() {
    if(this.data.login.logined) {
      this.requestForList()
    }
  },
  //login页面绑定的ui事件
  bindInputUsername(e) {this.setData!({'login.username': e.detail.value})},
  bindInputPassword(e) {this.setData!({'login.password': e.detail.value})},
  bindTapLogin() {
    client.auth.token.post({
      user_type: 'STUDENT', 
      username: this.data.login.username, 
      password: this.data.login.password}, (ok, s, d) => {
        if(ok) {
          let token = d['token']
          client.setToken(token)
          this.setData!({'login.logined': true})
          this.requestForList()
        }else{
          this.modal('登录失败', '请检查用户名和密码。')
        }
    })
  },
  //与菜单有关的ui事件
  bindTapMenu() {this.setData!({'ui.showMenu': !this.data.ui.showMenu})},
  bindChangeMenu() {this.setData!({'ui.showMenu': !this.data.ui.showMenu})},
  bindTapNewRecord() {
    this.bindChangeMenu()
    wx.navigateTo({url: '../edit/edit'})
  },
  bindTapProfile() {
    wx.navigateTo({url: '../profile/profile'})
  },
  //与筛选器有关的ui事件
  bindChangeStatus(e) {
    this.setData!({'ui.filterStatus': e.detail.value})
    this.requestForList()
  },
  //与列表有关的ui事件
  bindTapItem(e) {
    wx.navigateTo({url: `../detail/detail?id=${e.currentTarget.id}`})
  },
  //列表逻辑
  requestForList() {
    client.student.records.list({review__status: STATUS_VALUE_LIST[this.data.ui.filterStatus]}, (ok, s, d) => {
      if(ok) {
        this.setData!({data: d})
      }else{
        this.modal('错误', '列表拉取失败。')
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
