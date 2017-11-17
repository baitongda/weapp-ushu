/**
 * Created by Liujx on 2017-10-23 13:35:56
 */
const sliderWidth = 96; // 需要设置slider的宽度，用于计算中间位置
const bookDetailUrl = require('../../config').bookDetailUrl;
const creatBookDetailUrl = require('../../config').creatBookDetailUrl;
const collectBookUrl = require('../../config').collectBookUrl;
const cancelCollectUrl = require('../../config').cancelCollectUrl;
const addCartUrl = require('../../config').addCartUrl;
const shareSaveUrl = require('../../config').shareSaveUrl;
const generateUrl = require('../../config').generateUrl;
const cartTotalUrl = require('../../config').cartTotalUrl;
const util = require('../../utils/util');
let sessionId = wx.getStorageSync('sessionId')
Page({
    data: {
        tabs: ["图书详情", "图书目录", "内容简介", "作者简介"],
        activeIndex: 0,
        sliderOffset: 0,
        sliderLeft: 0,
        cartTotal: 0,
        bookDetailItem: [],
        fromId: ''
    },
    onLoad: function(option) {
        let self = this;
        let id = option.id || option.scene || option.CreateBookId;
        let fromId = option.uuid || option.fromId || '';
        this.setData({
            fromId: fromId
        })
        if(option.CreateBookId) {
            this.bookDetail(creatBookDetailUrl, id)
        } else {
            this.bookDetail(bookDetailUrl, id)
        }
        this.cartTotalRequest();
        wx.getSystemInfo({
            success: function(res) {
                self.setData({
                    sliderLeft: (res.windowWidth / self.data.tabs.length - sliderWidth) / 2,
                    sliderOffset: res.windowWidth / self.data.tabs.length * self.data.activeIndex
                });
            }
        });
    },
    tabClick: function(e) {
        this.setData({
            sliderOffset: e.currentTarget.offsetLeft,
            activeIndex: e.currentTarget.id
        });
    },
    // 图书详情
    bookDetail: function(url, id) {
        let self = this;
        wx.request({
            url: url,
            method: 'POST',
            header: {
                'content-type': 'application/x-www-form-urlencoded',
                'Cookie': 'JSESSIONID=' + sessionId
            },
            data: {
                id: id
            },
            success: data => {
                self.setData({
                    bookDetailItem: [data.data]
                })
            }
        })
    },
    // 收藏图书
    collectBookFun: function(e) {
        let self = this;
        let id = e.currentTarget.dataset.id;
        let isCollect = e.currentTarget.dataset.iscollect
        if(isCollect) {
            self.collectBookRequest(cancelCollectUrl, id, '取消收藏成功！', false)
        } else {
            self.collectBookRequest(collectBookUrl, id, '收藏成功！', true)
        }
    },
    // 收藏&&取消收藏
    collectBookRequest: function(url, id, msg, isCollect) {
        let self = this;
        wx.request({
            url: url,
            method: 'POST',
            header: {
                'content-type': 'application/x-www-form-urlencoded',
                'Cookie': 'JSESSIONID=' + sessionId
            },
            data: {
                bookListItemId: id
            },
            success: data => {
                if(data.data.success) {
                    util.showMessage(self, msg)
                    self.data.bookDetailItem[0].collected = isCollect;
                    self.setData({
                        bookDetailItem: self.data.bookDetailItem
                    })
                } else {
                    util.showMessage(self, data.data.msg)
                }
            }
        })
    },
    // 加入购物车
    addCartFun: function(e) {
        let self = this;
        let bookId = e.currentTarget.dataset.bookid;
        let bookListId = e.currentTarget.dataset.booklistid;
        wx.request({
            url: addCartUrl,
            method: 'POST',
            data: {
                bookId: bookId,
                bookListItemId: bookListId,
                fromShareId: self.data.fromId
            },
            header: {
                'content-type': 'application/x-www-form-urlencoded', // 默认值
                'Cookie': 'JSESSIONID=' + sessionId
            },
            success: data => {
                if(data.data.success) {
                    self.data.cartTotal++
                    self.setData({
                        cartTotal: self.data.cartTotal
                    })
                    util.showMessage(self, data.data.msg)
                } else {
                    util.showMessage(self, data.data.msg)
                }
            }
        })
    },
    // 立即购买 && 赠送朋友
    settlementFun: function(e) {
        const self = this;
        let isGive = e.currentTarget.dataset.give;
        let bookListItemId = e.currentTarget.dataset.id;
        wx.request({
            url: generateUrl,
            method: 'POST',
            data: {
                give: isGive,
                items: [{
                    'bookListItemId': bookListItemId,
                    'fromShareId': self.data.fromId,
                    'quantity': 1,
                }]
            },
            header: {
                'Cookie': 'JSESSIONID=' + sessionId
            },
            success: function(data) {
                if (data.data.success) {
                    wx.navigateTo({
                        url: '../submitOrder/submitOrder?id=' + data.data.data
                    })
                } else {
                    util.showMessage(self, data.data.msg)
                }
            }
        });
    },
    // 分享
    onShareAppMessage: function(res) {
        let self = this;
        let title = '';
        let path = '';
        let bookListItemId = res.target.dataset.id;
        let uuid = util.uuid();
        if (res.from === 'button') {
            title = res.target.dataset.title;
            path = '/pages/bookDetails/bookDetails?id=' + bookListItemId + '&uuid=' + uuid
        }
        return {
            title: title,
            path: path,
            success: function(res) {
                // 转发成功
                wx.request({
                    url: shareSaveUrl,
                    method: 'POST',
                    data: {
                        id: uuid,
                        bookListItemId: bookListItemId,
                        fromId: self.data.fromId
                    },
                    header: {
                        'content-type': 'application/x-www-form-urlencoded',
                        'Cookie': 'JSESSIONID=' + sessionId
                    },
                    success: data => {
                        if(data.data.success) {
                            util.showMessage(self, data.data.msg)
                        } else {
                            util.showMessage(self, data.data.msg)
                        }
                    }
                })
            },
            fail: function(res) {
                // 转发失败
            }
        }
    },
    // 获取购物车总数量
    cartTotalRequest: function() {
        let self = this;
        wx.request({
            url: cartTotalUrl,
            method: 'POST',
            data: {},
            header: {
                'content-type': 'application/x-www-form-urlencoded', // 默认值
                'Cookie': 'JSESSIONID=' + sessionId
            },
            success: data => {
                if(data.data.success) {
                    self.setData({
                        cartTotal: data.data.data || 0
                    })
                }
            }
        })
    },
    // 跳转购物车
    navigateToCart: function() {
        wx.switchTab({
            url: '../cart/cart'
        })
    }
})