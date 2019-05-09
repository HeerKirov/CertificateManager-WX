//edit.js
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

function isBlank(str: string): boolean {
  return str == null || str.length <= 0
}

function translateStudentModel(item: any, main: boolean): any {
  /* 将从服务器端取得的student model转换为本地格式。 */
  return {
    card_id: item.card_id, 
    name: item.name,
    grade: item.clazz_grade,
    number: item.clazz_number,
    subject: item.subject,
    college: item.college,
    main: main
  }
}

Page({
  data: {
    loading: false,
    editMode: false,
    editId: null,
    data: {
      students: [],
      teacher: null,
      image: {
        notice: {},
        award: {},
        list: {}
      }
    },
    teacherEdit: {
      on: false,
      list: []
    },
    studentEdit: {
      on: false,
      asMain: false,
      list: []
    },
    modal: {
      on: false,
      cancel: false,
      title: '',
      content: ''
    },
    bindStatusName: STATUS_NAME,
    bindStatusClass: STATUS_CLASS 
  },
  onLoad(option?: {id?: string}) {
    if(option && option.id) {
      //编辑模式
      this.setData!({editMode: true, editId: option.id})
      client.student.records.retrieve(option.id, (ok, s, d) => {
        if(ok) {
          this.setData!({
            data: this.formatForDetail(d)
          })
        }else{
          this.modal('错误', '拉取数据时发生预料之外的错误。')
        }
      })
      wx.setNavigationBarTitle({title: '编辑'})
    }else{
      //新建模式
      this.setData!({editMode: false, editId: null})
      wx.setNavigationBarTitle({title: '新建'})
    }
    
  },
  formatForDetail(d: any): any {
    let imageNotice = {}, imageAward = {}, imageList = {}
    for(let image of d.images) {
      let model = {file: `${app.globalData.serverURL}/static/image/${image.file}`, newFile: false}
      if(image.category === 'NOTICE') imageNotice = model
      else if(image.category === 'AWARD') imageAward = model
      else if(image.category === 'LIST') imageList = model
    }
    return {
      competition_name: d.competition_name,
      competition_category: d.competition_category,
      organizer: d.organizer,
      hold_time: d.hold_time,
      works_name: d.works_name,
      award_level: d.award_level,
      students: ((main, array) => {
        let res = []
        if(main) res.push(translateStudentModel(main, true))
        for(let item of array) {
          res.push(translateStudentModel(item, false))
        }
        return res
      })(d.main_student_info, d.students_info),
      teacher: d.teacher_info || {},
      review_status: d.review_status,
      rating_category: d.rating_category,
      rating_level_title: d.rating_level_title,
      rating_level: d.rating_level,
      image: {
        notice: imageNotice,
        award: imageAward,
        list: imageList
      }
    }
  },
  validateModel(): any {
    let data = this.data.data
    if(isBlank(data['competition_name'])) return '竞赛名称不能为空。'
    else if(isBlank(data['competition_category'])) return '竞赛分类不能为空。'
    else if(isBlank(data['hold_time'])) return '举办时间不能为空。'
    else if(isBlank(data['organizer'])) return '举办方不能为空。'
    else if(isBlank(data['award_level'])) return '获奖等级不能为空。'
    else if(!data.teacher || !data.teacher.card_id) return '必须指定指导教师。'
    else if(((students) => {
      for(let student of students) if(student.main) return false
      return true
    })(data.students)) return '至少需要指定一位第一负责人。'
    return null
  },
  translateToModel(): {model: any, images: any[]} {
    let data = this.data.data
    let model = {
      works_name: data['works_name'],
      award_level: data['award_level'],
      teacher: data.teacher && data.teacher['card_id'] ? data.teacher['card_id'] : null,
      students: ((students: any[]) => {
        let res = []
        for(let student of students) {
          if(student && !student.main) {
            res.push(student.card_id)
          }
        }
        return res
      })(data.students),
      main_student: ((students: any[]) => {
        for(let student of students) {
          if(student && student.main) return student.card_id
        }
      })(data.students),
      competition_name: data['competition_name'],
      competition_category: data['competition_category'],
      hold_time: data['hold_time'],
      organizer: data['organizer']
    }
    let images = []
    if(data.image.notice && data.image.notice['newFile']) images.push({category: 'NOTICE', file: data.image.notice['file']})
    if(data.image.award && data.image.award['newFile']) images.push({category: 'AWARD', file: data.image.award['file']})
    if(data.image.list && data.image.list['newFile']) images.push({category: 'LIST', file: data.image.list['file']})
    return {
      model,
      images
    }
  },
  //UI绑定事件
  bindChangeCompetitionName(e) {this.setData!({'data.competition_name': e.detail.value})},
  bindChangeCompetitionCategory(e) {this.setData!({'data.competition_category': e.detail.value})},
  bindChangeOrganizer(e) {this.setData!({'data.organizer': e.detail.value})},
  bindChangeHoldTime(e) {this.setData!({'data.hold_time': e.detail.value})},
  bindChangeWorksName(e) {this.setData!({'data.works_name': e.detail.value})},
  bindChangeAwardLevel(e) {this.setData!({'data.award_level': e.detail.value})},
  bindTapTeacherEdit() {this.setData!({'teacherEdit.on': !this.data.teacherEdit.on})},
  bindTapStudentEdit() {
    if(!this.data.studentEdit.on) {
      let asMain = true
      for(let item of this.data.data.students) {
        if(item && item.main) {
          asMain = false
          break
        }
      }
      this.setData!({'studentEdit.asMain': asMain})
    }
    this.setData!({'studentEdit.on': !this.data.studentEdit.on})
  },
  bindTapSubmit() {
    let err = this.validateModel();
    if(err != null) {
      this.modal('错误', err)
      return;
    }
    let {model, images} = this.translateToModel()
    this.setData!({loading: true})
    if(this.data.editMode && this.data.editId != null) {
      //编辑模式，提交PUT
      client.student.records.update(this.data.editId, model, (ok, s, d) => {
        if(ok) {
          this.submitImage(this.data.editId, images, (ok) => {
            if(ok) {
              wx.navigateBack({delta: 1})
            }else{
              this.modal('提交失败', '上传图片时发生预料之外的错误。')
            }
            this.setData!({loading: false})
          })
        }else{
          this.modal('提交失败', '提交条目修改时发生预料之外的错误。')
          this.setData!({loading: false})
        }
      })
    }else{
      //新建模式，提交POST
      client.student.records.create(model, (ok, s, d) => {
        if(ok) {
          this.submitImage(d['id'], images, (ok) => {
            if(ok) {
              wx.navigateBack({delta: 1})
            }else{
              client.student.records.delete(d['id'], (ok, s, d) => {})
              this.modal('提交失败', '上传图片时发生预料之外的错误。')
            }
            this.setData!({loading: false})
          })
        }else{
          this.modal('提交失败', '创建新条目时发生预料之外的错误。')
          this.setData!({loading: false})
        }
      })
    }
  },
  submitImage(awardId: number, images: any[], callback: (ok: boolean) => void) {
    if(images && images.length) {
      let cnt = images.length, allOk = true
      if(cnt > 0) {
        for(let image of images) {
          client.student.images.upload({award_record: awardId, category: image.category}, 'file', image.file, (ok, s, d) => {
            if(ok) {
              //do nothing
            }else{
              allOk = false
            }
            if(-- cnt <= 0) {
              callback(allOk)
            }
          })
        }
      }else{
        callback(true)
      }
    }else{
      //不需要提交，直接callback
      callback(true)
    }
  },
  //教师编辑面板
  bindConfirmTeacherSearch(e) {
    let search = e.detail.value ? e.detail.value.trim() : null
    client.student.teachers.list({search: search || ''}, (ok, s, d) => {
      if(ok) {
        this.setData!({'teacherEdit.list': d})
      }else{
        this.setData!({'teacherEdit.list': []})
        console.error(`发生错误： ${s}`)
      }
    })
  },
  bindTapTeacherSelect(e) {
    let index = e.currentTarget.id
    let item = this.data.teacherEdit.list[index]
    this.setData!({'data.teacher': item})
    this.bindTapTeacherEdit()
  },
  //学生编辑面板
  bindChangeStudentAsMain(e) {
    console.log(e.detail.value)
    this.setData!({'studentEdit.asMain': e.detail.value})
  },
  bindConfirmStudentSearch(e) {
    let search = e.detail.value ? e.detail.value.trim() : null
    client.student.students.list({search: search || ''}, (ok, s, d) => {
      if(ok) {
        let results = []
        for(let item of d) {
          results.push(translateStudentModel(item, false))
        }
        this.setData!({'studentEdit.list': results})
      }else{
        this.setData!({'studentEdit.list': []})
        console.error(`发生错误： ${s}`)
      }
    })
  },
  bindTapStudentSelect(e) {
    let index = e.currentTarget.id
    let item = this.data.studentEdit.list[index]
    let exist = false
    let list = this.data.data.students
    if(this.data.studentEdit.asMain) {
      for(let student of list) {
        if(student.main) {
          student.main = false
          break
        }
      }
    }
    for(let student of list) {
      if(student.card_id === item.card_id) {
        //存在重复添加。重复添加时，如果asMain生效，强制将目标设定为main；否则无动作
        if(this.data.studentEdit.asMain) {
          student.main = true
        }
        exist = true
        break
      }
    }
    if(!exist) {
      list.push({
        card_id: item.card_id, 
        name: item.name,
        grade: item.grade,
        number: item.number,
        subject: item.subject,
        college: item.college,
        main: this.data.studentEdit.asMain
      })
    }
    this.setData!({'data.students': list})
    this.bindTapStudentEdit()
  },
  bindTapStudentRemove(e) {
    let list = this.data.data.students
    let index = e.currentTarget.id
    list.splice(index, 1)
    this.setData!({'data.students': list})
  },
  //图片功能
  bindTapUpload(e) {
    let category = e.currentTarget.id
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed', 'original'],
      sourceType: ['album', 'camera'],
      success: (res: {tempFilePaths: string[], tempFiles: any[]}) => {
        if(res && res.tempFilePaths.length > 0 && res.tempFiles.length > 0) {
          let path = res.tempFilePaths[0]
          let file = res.tempFiles[0]
          if(category === 'notice') this.setData!({'data.image.notice.file': path, 'data.image.notice.newFile': true})
          else if(category === 'award') this.setData!({'data.image.award.file': path, 'data.image.award.newFile': true})
          else if(category === 'list') this.setData!({'data.image.list.file': path, 'data.image.list.newFile': true})
        }
      }
    })
  },
  //对话框
  modal(title: string, content: string) {
    this.setData!({
      'modal.title': title,
      'modal.content': content,
      'modal.on': true
    })
  },
  bindConfirmModal() {
    this.setData!({'modal.on': false})
  },
  bindCancelModal() {
    this.setData!({'modal.on': false})
  }
})
