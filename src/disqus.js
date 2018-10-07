/*!
 * DisqusJS | v0.1.0
 * Author: SukkaW
 * Link: https://github.com/SukkaW/DisqusJS
 * License: GPL-3.0
 */

/*
 * The variable used in DisqusJS
 *
 * DisqusJS Mode
 * disqusjs.mode = proxy | direct - Set which mode to use, should store and get in localStorage
 *
 * DisqusJS Config
 * disqusjs.config.shortname - The disqus shortname
 * disqusjs.config.identifier - The identifier of the page
 * disqusjs.config.url - The url of the page
 * disqusjs.config,api - Where to get data
 * disqusjs.config.apikey - The apikey used to request Disqus API
 * disqusjs.config.admin - The disqus forum admin username
 *
 * DisqusJS Info
 * disqusjs.page.id = The thread id, used at next API call
 * disqusjs.page.title - The thread title
 * disqusjs.page.isClosed - Whether the comment is closed
 * disqusjs.page.lenfth - How many comment in this thread
 */

disqusjs.page = [];
disqusjs.mode = 'proxy';
var xhr = new XMLHttpRequest();

setLS = (key, value) => {
    try {
        localStorage.setItem(key, value)
    } catch (o) {
        console.log(o), console.log("Failed to set localStorage item")
    }
}

getLS = (key) => {
    return localStorage.getItem(key);
}

/*
 * Name: Date.Format()
 *
 * Usage:
 * Month - M | MM
 * Date - d | dd
 * Hour - h | hh
 * Minute - m | mm
 * Second - s | ss
 * Season - q | qq
 * Year - y | yy | yyyy
 * ms - S
 *
 * Example: (new Date()).Format("yyyy-MM-dd hh:mm:ss.S")
 */

Date.prototype.Format = function (fmt) {
    var o = {
        "M+": this.getMonth() + 1, // Minth
        "d+": this.getDate(), // Date
        "h+": this.getHours(), // Hour
        "m+": this.getMinutes(), // Minute
        "s+": this.getSeconds(), // Second
        "q+": Math.floor((this.getMonth() + 3) / 3), // Season
        "S": this.getMilliseconds() // ms
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}

/*
 * Name: getMode()
 * Description: get mode from localstorage
 */

function getMode() {
    let s = getLS('disqusjs_mode');
    if (!s) {
        // Run checkDisqus() when no localStorage item
        // disqusjs.mode will be set in checkDisqus()
        checkDisqus();
    } else {
        disqusjs.mode = s;
    }
}

/*
 * Name: loadDisqus()
 * Descriptin: load disqus as it should be.
 */

function loadDisqus() {
    var d = document;
    var s = d.createElement('script');
    s.src = '//' + disqusjs.config.shortname + '.disqus.com/embed.js';
    s.setAttribute('data-timestamp', + new Date());
    (d.head || d.body).appendChild(s);
}

/*
 * Name: checkDisqus()
 * Description: Check disqus is avaliable for visitor or not
 * How it works: check favicons under 2 domains can be loaded or not.
*/
function checkDisqus() {
    let domain = ['disqus.com', disqusjs.config.shortname + '.disqus.com'],
        test = 0,
        success = 0;
    setmode = () => {
        if (success = test) {
            disqusjs.mode = 'direct',
                setLS('disqusjs_mode', 'direct');
        } else {
            disqusjs.mode = 'proxy',
                setLS('disqusjs_mode', 'proxy');
        }
    };
    check = (domain) => {
        var img = new Image;
        var checker = setTimeout(() => {
            img.onerror = img.onload = null,
                test++ ,
                setmode();
        }, 3000);
        img.onerror = () => {
            clearTimeout(checker),
                test++ ,
                setmode();
        };
        img.onload = () => {
            clearTimeout(checker),
                success++ ,
                test++ ,
                setmode();
        };
        img.src = 'https://' + domain + '/favicon.ico?' + +(new Date);
    };
    for (let i of domain) {
        check(i);
    };
}

/*
 * Name: getThreadInfo()
 * Description: Disqus API only support get thread list by ID, not identifter. So get Thread ID before get thread list.
 * API Docs: https://disqus.com/api/docs/threads/list/
 * API URI: /3.0/threads/list.json?forum=[disqus_shortname]&thread=ident:[identifier]&api_key=[apikey]
*/

function getThreadInfo() {

    /*
     * Name: getComment()
     * Description: get the comment content
     * API URI: /3.0/posts/list.json?forum=[shortname]&thread=[thread id]&api_key=[apikey]
     */

    getComment = () => {
        let url = disqusjs.config.api + '3.0/posts/list.json?forum=' + disqusjs.config.shortname + '&thread=' + disqusjs.page.id + '&api_key=' + disqusjs.config.apikey;
        xhr.open('GET', url, true);
        xhr.timeout = 4000;
        xhr.send();
        xhr.onload = function () {
            if (this.status == 200 || this.status == 304) {
                var res = JSON.parse(this.responseText);
                if (res.code === 0) {
                    getCommentList(res.response);
                } else {
                    // Have error when get comments.
                }

            }
        };
        xhr.ontimeout = (e) => {
            console.log(e)
        };
        xhr.onerror = (e) => {
            console.log(e)
        };
    }

    let url = disqusjs.config.api + '3.0/threads/list.json?forum=' + disqusjs.config.shortname + '&thread=ident:' + disqusjs.config.identifier + '&api_key=' + disqusjs.config.apikey;
    xhr.open('GET', url, true);
    xhr.timeout = 4000;
    xhr.send();
    xhr.onload = function () {
        if (this.status == 200 || this.status == 304) {
            var response = JSON.parse(this.responseText).response[0];
            disqusjs.page = {
                id: response.id,
                title: response.title,
                isClosed: response.isClosed,
                length: response.posts
            };
            getComment();
        }
    };
    xhr.ontimeout = (e) => {
        console.log(e)
    };
    xhr.onerror = (e) => {
        console.log(e)
    };
}

/*
 * Name: getCommentList(data)
 * Description: Render JSON to comment list components
 */

function getCommentList(data) {
    var topLevelComments = [];
    var childComments = [];

    data.forEach(comment => {
        (comment.parent ? childComments : topLevelComments)['push'](comment)
    })

    var commentLists = topLevelComments.map(comment => {
        return {
            comment,
            author: comment.author.name,
            isPrimary: comment.author.username === disqusjs.config.admin,
            children: getChildren(+comment.id)
        };
    });

    function getChildren(id) {
        if (childComments.length === 0) return null;

        var list = [];
        for (let comment of childComments) {
            if (comment.parent === id) {
                list.unshift({
                    comment,
                    author: comment.author.name,
                    isPrimary: comment.author.username === disqusjs.config.admin,
                    children: getChildren(+comment.id)
                });
            }
        }

        if (list.length) {
            return list;
        } else {
            return null;
        }
    }

    renderComment(commentLists)
}

function renderComment(data) {
    var disqusjsBaseTpl = `
    <div id="dsqjs">
        <section class="dsqjs-action"></section>
        <header></header>
        <section class="dsqjs-container"><ul id="dsqjs-list" class="dsqjs-list"></ul></section>
    </div>
    `;
    document.getElementById('disqus_thread').innerHTML = disqusjsBaseTpl;

    data.map(s => {
        childrenComments = (s) => {
            var children = (s.children || []);
            if (typeof children === 'null') return;

            var html = '<ul class="dsqjs-list dsqjs-children">';
            console.log(children)
            children.map(s => {
                let comment = s.comment

                if (comment.author.profileUrl) {
                    var avatar = `
                    <a href="${comment.author.profileUrl}" target="_blank" rel="nofollow noopener noreferrer">
                        <img src="${comment.author.avatar.cache}">
                    </a>
                    `;
                    var author = `<a href="${comment.author.profileUrl}">${comment.author.name}</a>`
                } else {
                    var avatar = `<img src="${comment.author.avatar.cache}">`;
                    var author = `${comment.author.name}`
                }

                html += `
                <li class="dsqjs-item" id="comment-${comment.id}">
                <div class="dsqjs-item-container">
                    <div class="dsqjs-avater">
                        ${avatar}
                    </div>
                    <div class="dsqjs-body">
                        <header class="dsqjs-header">
                            <span class="dsqjs-author">${author}</span>
                            <span class="dsqjs-bullet"></span>
                            <span class="dsqjs-meta"><time>${(new Date(comment.createdAt)).Format("yyyy-MM-dd hh:mm:ss")}</time></span>
                        </header>
                        <div class="dsqjs-content">${comment.message}</div>
                    </div>
                </div>
                ${childrenComments(s)}
                </li>
                `
            })

            html += '</ul>';

            if (html.length !== 0) {
                return html;
            } else {
                return;
            }
        };

        let comment = s.comment;

        if (comment.author.profileUrl) {
            var avatar = `
            <a href="${comment.author.profileUrl}" target="_blank" rel="nofollow noopener noreferrer">
                <img src="${comment.author.avatar.cache}">
            </a>
            `;
            var author = `<a href="${comment.author.profileUrl}">${comment.author.name}</a>`
        } else {
            var avatar = `<img src="${comment.author.avatar.cache}">`;
            var author = `${comment.author.name}`
        }

        let html = `
        <li class="dsqjs-item" id="comment-${comment.id}">
        <div class="dsqjs-item-container">
            <div class="dsqjs-avater">
                ${avatar}
            </div>
            <div class="dsqjs-body">
                <header class="dsqjs-header">
                    <span class="dsqjs-author">${author}</span>
                    <span class="dsqjs-bullet"></span>
                    <span class="dsqjs-meta"><time>${(new Date(comment.createdAt)).Format("yyyy-MM-dd hh:mm:ss")}</time></span>
                </header>
                <div class="dsqjs-content">${comment.message}</div>
            </div>
        </div>
        ${childrenComments(s)}
        </li>
        `;
        document.getElementById('dsqjs-list').insertAdjacentHTML('beforeend', html);
    })
}


getThreadInfo();