//detail.js
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
const IMAGE_CATEGORY_NAME = {
  NOTICE: '比赛通知',
  AWARD: '获奖证书',
  LIST: '获奖名单页'
}

const app = getApp<IMyApp>()
const client: Client = app.globalData.client

Page({
  data: {
    id: null,
    data: {},
    bindStatusName: STATUS_NAME,
    bindStatusClass: STATUS_CLASS 
  },
  onLoad(option?: {id?: string}) {
    this.setData!({id: option.id})
  },
  onShow() {
    client.student.records.retrieve(this.data.id, (ok, s, d) => {
      if(ok) {
        this.setData!({
          data: this.formatForDetail(d)
        })
      }else{
        console.error(`发生错误： ${s}`)
      }
    })
  },
  formatForDetail(d: any): any {
    return {
      id: d.id,
      competition_name: d.competition_name,
      competition_category: d.competition_category,
      organizer: d.organizer,
      hold_time: d.hold_time,
      works_name: d.works_name,
      award_level: d.award_level,
      students: ((main, array) => {
        let res = []
        if(main) res.push({
          card_id: main.card_id, 
          name: main.name,
          grade: main.clazz_grade,
          number: main.clazz_number,
          subject: main.subject,
          college: main.college,
          main: true
        })
        for(let item of array) {
          res.push({
            card_id: item.card_id, 
            name: item.name,
            grade: item.clazz_grade,
            number: item.clazz_number,
            subject: item.subject,
            college: item.college,
            main: false
          })
        }
        return res
      })(d.main_student_info, d.students_info),
      teacher: d.teacher_info || {},
      review_status: d.review_status,
      rating_category: d.rating_category,
      rating_level_title: d.rating_level_title,
      rating_level: d.rating_level,
      images: ((images) => {
        let res = []
        for(let image of images) {
          res.push({
            id: image.id,
            category: image.category,
            category_name: IMAGE_CATEGORY_NAME[image.category],
            file: `${app.globalData.serverURL}/static/image/${image.file}`
          })
        }
        return res
      })(d.images)
    }
  },
  bindTapEdit() {
    wx.navigateTo({url: `../edit/edit?id=${this.data.data['id']}`})
  }
})
