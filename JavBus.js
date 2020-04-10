// ==UserScript==
// @name         JavBus
// @namespace    https://greasyfork.org/zh-CN/users/495073-fts3232
// @version      1.0.0
// @source       https://github.com/fts3232/oldDriver
// @description  JavBus排版更新
// @author       fts3232

// @require      https://cdn.bootcss.com/jquery/3.4.1/jquery.min.js
// @require      https://cdn.bootcss.com/masonry/4.2.2/masonry.pkgd.min.js

// @include     *://*javbus.com/*
// @include     *://*cdnbus.one/*

// @run-at       document-idle
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_notification
// @grant        GM_setClipboard
// @grant        GM_getResourceURL

// @connect      *
// @copyright    MIT

// ==/UserScript==
(function () {
    'use strict';
    // 瀑布流状态：1：开启、0：关闭
    let waterfallScrollStatus = GM_getValue('scroll_status', 1);
    // 当前网页域名
    let domain = location.host;
    // 数据库
    let javDb;
    // 表
    let myMovie;

    //瀑布流
    let waterfall = function () {
        this.done = true;
        this.obj = null;
        this.init = function () {
            // javbus.com
            if ($("footer:contains('JavBus')").length) {
                this.obj = $('div.masonry').masonry({
                    itemSelector: ".item",
                    isAnimated  : false,
                    isFitWidth  : true
                });
            }
            if (waterfallScrollStatus > 0) {
                document.addEventListener('scroll', this.scroll.bind(this));
            }
        }

        this.scroll = function () {
            if ($('.pagination')[0].getBoundingClientRect().top - $(window).height() < 500 && this.done) {
                this.getData();
            }
        }

        this.getData = function () {
            let url = $('a#next').attr('href');
            let _this = this;
            if (url !== undefined) {
                this.done = false;
                fetch(url, {credentials: 'same-origin'})
                    .then(function (response) {
                        return response.text();
                    })
                    .then(function (html) {
                        let dom = new DOMParser().parseFromString(html, 'text/html');
                        dom = $(dom);
                        let elems = dom.find('div#waterfall div.item');
                        elems.each(function () {
                            $(this).attr('style', '');
                        });
                        $('.pagination').html(dom.find('.pagination').html());
                        _this.obj.append(elems)
                            .masonry('appended', elems)
                            .masonry();
                        _this.done = true;
                    })
            }
        }
    }

    function javbus() {
        //删除不需要的内容
        $('.mb20').prev('h4').remove();
        $('#urad2').parents('h4').remove();
        //删除广告
        $('.ad-table,.ad-list,.mb20').remove();
        //超链接改为新窗口打开
        $('a.movie-box').attr('target', '_blank');
        let waterfallObj = new waterfall();
        waterfallObj.init();
    }

    if (domain.indexOf('bus') !== '-1') {
        javbus();
    }
})();