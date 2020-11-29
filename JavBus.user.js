// ==UserScript==
// @name         JavBus
// @namespace    https://greasyfork.org/zh-CN/users/495073-fts3232
// @homepageURL  https://github.com/fts3232/oldDriver
// @version      1.0.6
// @source       https://github.com/fts3232/oldDriver
// @description  JavBus排版更新
// @author       fts3232

// @require      https://cdn.jsdelivr.net/npm/jquery@3.5.0/dist/jquery.min.js
// @require      https://cdn.jsdelivr.net/npm/masonry-layout@4.2.2/dist/masonry.pkgd.min.js
// @require      https://cdn.jsdelivr.net/npm/bootstrap@3.4.1/dist/js/bootstrap.min.js

// @include     *://*javbus.com/*
// @include     *://*cdnbus.one/*
// @include     *://*javlibrary.com/*

// @include     *://www.*bus*/*
// @include     *://www.*dmm*/*

// @run-at       document-idle
// @grant        GM_download
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_notification
// @grant        GM_setClipboard
// @grant        GM_getResourceURL

// @connect      btsow.club

// @license      MIT


//测试123

// ==/UserScript==
(function () {
    'use strict';


    function GM_addStyle(css) {
        const style = document.getElementById("GM_addStyleBy8626") || (function () {
            const style = document.createElement('style');
            style.type = 'text/css';
            style.id = "GM_addStyleBy8626";
            document.head.appendChild(style);
            return style;
        })();
        style.innerHTML = css;
    }

    //瀑布流
    class Waterfall {
        constructor() {
            // 瀑布流状态：1：开启、0：关闭
            this.waterfallScrollStatus = GM_getValue('scroll_status', 1);
            this.done = true;
            this.masonryObj = null;
            this.config = {};
        }

        init(config) {
            this.config = config;
            //滚动
            if (this.waterfallScrollStatus > 0 && $(this.config['pagination']).length > 0) {
                document.addEventListener('scroll', this.scroll.bind(this));
            }
            if (this.config['useMasonry']) {
                this.masonryObj = $(this.config['selector']).masonry({
                    itemSelector: this.config['items'],
                    isAnimated  : false,
                    isFitWidth  : true
                })
            }
        }

        //滚动到底获取数据
        scroll() {
            if ($(this.config['pagination'])[0].getBoundingClientRect().top - $(window).height() < 500 && this.done) {
                this.getData();
            }
        };

        //获取数据
        getData() {
            let url = $(this.config['next']).attr('href');
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
                        let avatarBox = dom.find(_this.config['items']).find('.avatar-box');
                        if (avatarBox.length > 0) {
                            avatarBox.parent().remove();
                        }
                        let elems = dom.find(_this.config['items']);
                        elems.each(function (i) {
                            $(this).attr('style', '');
                            $(this).find('a').attr('target', '_blank')
                            if (_this.config['selector'] === 'div#video_comments') {
                                let text = $(this).find('textarea').val();
                                text = text.replace(/\[url=([^\[\]]*?)\](.*?)\[\/url\]/g, '<a href="redirect.php?url=$1" target="_blank">$2</a>')
                                text = text.replace(/\[color=([^\[\]]*?)\](.*?)\[\/color\]/g, '<span style="color:$1">$2</span>')
                                text = text.replace(/\[b\](.*?)\[\/b\]/g, '<b>$1</b>')
                                $(this).find('.text').html(text).css('width', '442px');
                            }
                        });
                        $(_this.config['pagination']).html(dom.find(_this.config['pagination']).html());
                        $(_this.config['selector']).append(elems);
                        if (_this.config['useMasonry']) {
                            _this.masonryObj.masonry('appended', elems).masonry();
                        }
                        _this.done = true;
                    })
            }
        }
    }

    class Request {
        constructor() {
            this.lock = [];
        }

        send(url, successCallback) {
            let _this = this;
            return new Promise(function (resolve, reject) {
                let index = _this.lock.indexOf(url);
                if (index === -1) {
                    _this.lock.push(url);
                    GM_xmlhttpRequest({
                        url,
                        method   : 'GET',
                        headers  : {
                            "Cache-Control": "no-cache"
                        },
                        timeout  : 30000,
                        onload   : function (response) {
                            console.log(url + ' success');
                            _this.lock.splice(index, 1);
                            resolve(response);
                        },
                        onabort  : (e) => {
                            console.log(url + " abort");
                            reject("wrong");
                        },
                        onerror  : (e) => {
                            console.log(url + " error");
                            console.log(e);
                            reject("wrong");
                        },
                        ontimeout: (e) => {
                            console.log(url + " timeout");
                            reject("wrong");
                        },
                    });
                } else {
                    reject("发送请求ing");
                }
            }).then(function (response) {
                successCallback(response);
            }, function (err) {
                console.log(err)
            });
        }
    }

    class Base {
        constructor(Request, Waterfall) {
            this.Request = Request;
            this.Waterfall = Waterfall;
            this.resourceSiteLock = {};
            this.resourceSites = {
                "btsow.club": function (keyword, callback) {
                    let url = 'http://btsow.club/search/' + keyword;
                    Request.send(url, function (response) {
                        let magnetLink = [];
                        let dom = new DOMParser().parseFromString(response.responseText, 'text/html');
                        dom = $(dom);
                        let a = dom.find('.data-list a');
                        if (a.length > 0) {
                            a.each(function () {
                                let href = $(this).attr('href');
                                let hash = href.substring(href.indexOf('hash') + 5);
                                magnetLink.push({
                                    'title'     : $(this).attr('title'),
                                    'magnetLink': 'magnet:?xt=urn:btih:' + hash,
                                    'size'      : $(this).nextAll('.size').html(),
                                    'date'      : $(this).nextAll('.date').html(),
                                    'src'       : href,
                                });
                            });
                        }
                        callback(magnetLink);
                    });
                }
            };
        }

        fetchMagnetLink(site, code, success) {
            if (typeof this.resourceSiteLock[site] === 'undefined' && typeof this.resourceSites[site] !== 'undefined') {
                this.resourceSiteLock[site] = true;
                this.resourceSites[site](code, success);
            }
        }
    }

    class JavBus extends Base {
        constructor(Request, Waterfall) {
            super(Request, Waterfall);
            GM_addStyle(`
                .tab-pane td, .table-condensed > tbody > tr > td { padding:8px; } 
                .info a.red {color:red}
                .pointer {cursor:pointer}
                .screencap {
                        position: relative;
                }
                .screencap a.download {
                    position: absolute;
                    background: #fff;
                    border: 1px solid #000;
                    padding: 5px 10px;
                    border-radius: 5px;
                    font-size: 12px;
                    right: 20px;
                    top: 5px;
                }
            `);
            this.deleteAD();
            if ($('div.masonry').length > 0) {
                this.listPage();
            }
            if ($('.col-md-3.info').length > 0) {
                this.detailPage();
            }
        }

        detailPage() {
            let _this = this;
            let info = $('.col-md-3.info');
            //识别码
            let codeRow = info.find('p').eq(0);
            let code = codeRow.find('span').eq(1).html();
            codeRow.append($('<span style="color:red">←点击复制</span>'));
            codeRow.on('click', function () {
                GM_setClipboard(code);
                $(this).find('span').eq(2).html('←已复制到黏贴板');
            });
            //资源表格生成
            this.createTabs();
            //切换事件
            $(document).on('click', 'a[data-toggle="tab"]', function (e) {
                let site = $(this).data('site');
                let id = $(this).attr('href');
                _this.fetchMagnetLink(site, code, function (magnetLink) {
                    if (magnetLink.length > 0) {
                        $(id).find('table tbody tr').eq(1).remove();
                        $.each(magnetLink, function (i, v) {
                            $('<tr class="pointer"><td>' + v.title + '</td><td class="text-center">' + v.size + '</td><td class="text-center">' + v.date + '</td></tr>').on('click', function () {
                                window.open(v.magnetLink, '_self')
                            }).appendTo($(id).find('table tbody'));
                        });
                    } else {
                        $(id).find('table tbody tr').eq(1).find('td').html('找不到对应的内容');
                    }
                });
            })
            //添加跳转到javlibrary链接
            info.append("<p><a class='red' href='http://www.javlibrary.com/cn/vl_searchbyid.php?keyword=" + code + "' target='_blank'>javlibrary</a></p>");
            //演员
            $('.genre a').attr('target', '_blank');
            //封面图添加下载按钮
            let downloadBtn = $('<a class="download">下载</a>');
            let imgUrl = $('.screencap img').attr('src');
            downloadBtn.on('click', function (e) {
                e.stopPropagation();
                GM_download({
                    url:imgUrl,
                    saveAs:true,
                    name:code + imgUrl.substring(imgUrl.lastIndexOf("."))
                });
                return false;
            });
            downloadBtn.attr('download', code);
            $('.screencap').append(downloadBtn);
        }

        listPage() {
            //初始化瀑布流
            this.Waterfall.init({
                'useMasonry': true,
                'selector'  : 'div.masonry',
                'pagination': 'ul.pagination',
                'next'      : 'a#next',
                'items'     : 'div.item',
            });
            //超链接改为新窗口打开
            $('a.movie-box').attr('target', '_blank');
        }

        deleteAD() {
            //删除不需要的内容
            $('.mb20').prev('h4').remove();
            $('#urad2').parents('h4').remove();
            //删除广告
            $('.ad-table,.ad-list,.mb20,.ptb10').remove();

        }

        createTabs() {
            let div = $('<div></div>');
            let ul = $('<ul class="nav nav-tabs" role="tablist"></ul>');
            let content = $('<div class="tab-content"></div>');
            let magnetTable = $('#magnet-table').parent('.movie').css({'border': '1px solid #ddd', 'margin-top': '0', 'box-shadow': 'none'});
            content.append($('<div role="tabpanel" id="panel0" class="tab-pane fade active in"></div>').append(magnetTable));
            ul.append($('<li role="presentation" class="active"><a href="#panel0" role="tab" data-toggle="tab">本站</a></li>'));
            let i = 1;
            for (let x in this.resourceSites) {
                ul.append($('<li role="presentation"><a href="#panel' + i + '" role="tab" data-toggle="tab" data-site="' + x + '">' + x + '</a></li>'));
                let panel = $('<div role="tabpanel" id="panel' + i + '" class="tab-pane fade"></div>');
                let panelContent = $('<div></div>').css({'border': '1px solid #ddd', 'padding': '12px', 'background': '#fff'});
                let table = $('<table class="table table-striped table-hover" style="margin-bottom:0;"><tbody></tbody></table>');

                let th = $('<tr><th width="70%">磁力名稱 <span class="glyphicon glyphicon-magnet"></span></th><th class="text-center">檔案大小</th><th class="text-center">分享日期</th></tr>');
                table.find('tbody').append(th);
                let tr = $('<tr><td class="text-center" colspan="3">讀取中...</td></tr>');
                table.find('tbody').append(tr);
                panelContent.append(table);
                panel.append(panelContent);
                content.append(panel);
                i++;
            }
            ul.appendTo(div);
            content.appendTo(div);
            $('#mag-submit-show').after(div);
        }
    }

    class JavLibrary extends Base {
        constructor(Request, Waterfall) {
            super(Request, Waterfall);
            GM_addStyle(`
                #video_info td {
                    vertical-align: text-bottom;
                }
                #video_jacket {
                    position: relative;
                }
                #video_jacket a {
                    position: absolute;
                    background: #fff;
                    border: 1px solid #000;
                    padding: 5px 10px;
                    border-radius: 5px;
                    font-size: 12px;
                    right: 5px;
                    top: 5px;
                }
            `);
            if ($('div.page_selector').length > 0) {
                this.listPage();
            }
            if ($('#video_info').length > 0) {
                this.detailPage();
            }
        }

        listPage() {
            let config = {
                'useMasonry': false,
                'selector'  : 'div.videos',
                'pagination': 'div.page_selector',
                'next'      : 'a.page.next',
                'items'     : 'div.video',
            };
            if ($('#video_comments').length > 0) {
                config = {
                    'useMasonry': false,
                    'selector'  : 'div#video_comments',
                    'pagination': 'div.page_selector',
                    'next'      : 'a.page.next',
                    'items'     : 'table.comment',
                };
            }
            //初始化瀑布流
            this.Waterfall.init(config);
            //超链接改为新窗口打开
            $('.comment a').attr('target', '_blank');
            $('.videos a').attr('target', '_blank');
        }

        detailPage() {
            let _this = this;
            let info = $('#video_info');
            //识别码
            let codeRow = info.find('.item').eq(0);
            let code = codeRow.find('.text').html();
            codeRow.find('tr').append($('<td class="text" style="color:red">←点击复制</td>'));
            codeRow.on('click', function () {
                GM_setClipboard(code);
                $(this).find('td').last().html('←已复制到黏贴板');
            });
            //添加跳转到javlibrary链接
            info.append("<div class='item'><table><tbody><tr><td class='header'><a class='red' href='https://www.busfan.blog/" + code + "' target='_blank'>javbus</a></td></tr></tbody></table></div>");
            //演员
            info.find('a').attr('target', '_blank');
            //封面图添加下载按钮
            let downloadBtn = $('<a>下载</a>');
            let imgUrl = $('#video_jacket img').attr('src');
            downloadBtn.on('click', function () {
                GM_download({
                    url:imgUrl,
                    saveAs:true,
                    name:code + imgUrl.substring(imgUrl.lastIndexOf("."))
                });
            });
            downloadBtn.attr('download', code);
            $('#video_jacket').append(downloadBtn);
        }
    }

    class Main {
        constructor() {
            if ($("footer:contains('JavBus')").length) {
                this.site = 'javBus';
            } else if ($("#bottomcopyright:contains('JAVLibrary')").length) {
                this.site = 'javLibrary'
            }
        }

        make() {
            let waterfallObj = new Waterfall();
            let requestObj = new Request();
            let obj;
            switch (this.site) {
                case 'javBus':
                    obj = new JavBus(requestObj, waterfallObj);
                    break;
                case 'javLibrary':
                    obj = new JavLibrary(requestObj, waterfallObj);
                    break;
            }
            return obj;
        }
    }

    let main = new Main();
    main.make();
})();