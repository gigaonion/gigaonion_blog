+++
title = '今更ながらhugoのテーマをフルスクラッチで作成した'
date = 2025-08-26T00:00:00+09:00
draft = false
lastmod = 2025-08-27T00:00:00+09:00
tags = ['JavaScript','html','CSS','日記']
categories = ['Tech']
+++
初めまして．ぎがおにおんです．数年前に，このドメインでWordPress(以下，WPとする)を運用していたのですが，ひょんなことからサーバを吹き飛ばした[^1]ことから，ポータビリティが欲しいと思い(WPはブログだけにしては無駄に重いし)，SSGでのデプロイをしたいなーと漠然と思いながらドメインを1年近く放置(もったいない!)．夏にまとまった時間がとれたので重い腰を上げて実装を開始してようやっと完成した次第．
[^1]: 相対パスと間違えて，rm -rf /*を実行(ワイルドカードを付けると保護が無効になるのだ!(絶望))
<!--more-->
## なぜSSGか

正直自宅鯖置いてるので，WPも構築自体はた易いものでしたが，ブログを商売にしているわけではないし，WPなどのでっかいCMSは過剰に感じていました．~~重くても大したPVじゃないからどうでもいいんだけど~~そこで，凝り性な自分に，「じゃあ全部自前で用意しよう!」という魔が差して制作を開始．この辺の分野はナレッジがいくらでも転がっているだろうと高をくくってたんですが，意外と一週間くらいかかってしまった...
## コンセプト

時代と逆行している気がしないでもないですが，私がまずホムペと聞いて思い浮かべた構想は個人ブログでした．それも丁度自分が初めてネットに触れた頃のやつ！~~最先端技術の~~アクセスカウンタ，謎に動く文字，キリ番を踏んで大興奮とかそういうやつです．それに，最近のモダンなページの洗練された要素(ホバーのアニメーションとか)を融合してカオスな~~自己満~~ページを目指しました，というかそれが作りたくてページを作成したみたいな経緯があります．

### デザイン

まあ，このページを見れば明らかなように，コンセプトはターミナルです．私，`#000000`か`#ffffff`を背景にしてて，原色バリバリのページばっかり見て育ってきたんで当然憧れるのはギーク，~~いや，ナード~~なデザイン，つまりターミナルなわけですね．配色は当然として，見出しをシェルのプロンプト風にし，ブリンカーまでつけてみました．
また，アニメーションは正直初めてだったので，[リファレンス](https://developer.mozilla.org/ja/docs/Web/CSS/CSS_animations/Using_CSS_animations)見まくって完成．

### バックエンド

実はこのページ，静的ではあるんですがコメントとカウンタを備えています．探せばセルフホストできそうなツールがありそうでしたが，要求仕様がかなりシンプルなので自前で作ったほうが早いと思って書きました．その手のサービスは更新やら保守がやりにくいし，ブラックボックスがあまり好きでないのです．バックエンドはnodejs．やっぱり，SSGは仮に高負荷がかかっても処理落ちするのはバックエンドだけっていうのが，SSRと違ってページ自体は読まれるので素晴らしい!
かっこつけて簡単に書いているけれど，JWTのセッション管理やら非同期処理やら初めての技術にばかりでなかなか大変でした．


## 実装について

軽く実装の勘所を，備忘録的に紹介していきます．


### Hugoのテーマについて

Goのテンプレートなんて全く知らなかったので，結構きつかったです．特に，記事を年別・月別でグループ化して表示するアーカイブページの実装がやばい．最初は全記事をループさせて，年が変わるたびに`<h2>`タグを出力しようとか考えていたのですが，それだと年や月の入れ物がうまく作れない．公式ドキュメントで`GroupByDate`という便利な関数を見つけて解決しました．

```html
{{/* themes/blog/layouts/_default/archive.html */}}
{{ $pages := where .Site.RegularPages "Type" "posts" }}
{{/* まずは年でグループ化 */}}
{{ range ($pages.GroupByDate "2006").Reverse }}
  {{ $year := .Key }}
  <h2 class="archive-year"><a href='{{ "/posts" | relURL }}?year={{ $year }}'>{{ $year }}年</a></h2>
  <ul class="archive-months">
		{{/* 年ごとのページ群を，さらに月でグループ化 */}}
		{{ range .Pages.GroupByDate "1" }}
		<li>
		  <a href='{{ "/posts" | relURL }}?year={{ $year }}&month={{ printf "%02d" (int .Key) }}'>{{ printf "%02d" (int .Key) }}月</a>
		  ({{ len .Pages }}件)
		</li>
	  {{ end }}
 </ul>
{{ end }}
```

`GroupByDate "2006"`[^2]で年ごとに，さらにその中で`GroupByDate "1"`とすることで月ごとにまとめることができるんですね．何とも分かりにくい...

それともう一つ，Hugoのビルド時に，サイト内の全記事のメタデータをまとめて`search.json`という一つのJSONファイルを生成させてます．[^gemini]テンプレートエンジンでhtml以外を出すというのが新鮮だった．
[^gemini]: 検索機能についてgeminiに相談したら提案されました．完敗です()
```json
{{- /* layouts/index.search.json */ -}}
{{- $index := slice -}}
{{- range where .Site.RegularPages "Type" "posts" -}}
  {{- $index = $index | append (dict
      "title" .Title
      "url" .RelPermalink
      "tags" .Params.tags
      "slug" (.Slug | default .File.BaseFileName)
      "Date" (.Date.Format "2006-01-02T15:04:05-07:00")
      /* ... a rest of the fields ... */
    )
  -}}
{{- end -}}
{{- $index | jsonify -}}
```

この`search.json`を，検索やアーカイブといった動的機能のソースに使ってトラフィックを少なくしてます．

[^2]: 何で2006なんでしょう

### デザイン

コンセプトでも述べましたが，とにかくアニメーションをで遊びたい!ページ名の下のウェーブみたいな文字は他で見ないのでは？[^3]これはCSSの`@keyframes`を使って実装しています．各文字(`<span>`)に同じアニメーションを適用しつつ，一文字ずつディレイをかけてます．
[^3]: ~~ダサいからですかね~~

```css
/* themes/blog/assets/css/main.css */
@keyframes wave {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px); /* アニメーションの中間で上に5px移動 */
  }
}

.bouncing-text {
  animation-name: wave;
  animation-duration: 1s;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
}

/* 各文字に遅延を設定 */
.bouncing-text:nth-child(2) { animation-delay: 0.1s; }
.bouncing-text:nth-child(3) { animation-delay: 0.2s; }
/* ...以下続く... */
```

CSS，真面目にやったのは初ですが楽しいですね．

### バックエンド

#### コメントのツリー表示

コメント機能は，どうしてもツリーが欲しかったので沼りました．APIからは親子関係を示す`parent_id`を持つフラットなコメントリストを返すようにしたのですが，これをどうやって入れ子構造にして表示するかが課題でした．ループでやる方法も考えましたが，計算量が`O(N^2)`...そこで，まずはJavaScript側でコメントIDをキーにしたMapを作成し，効率的にツリー構造を構築する処理を挟んでみました．

```javascript
// themes/blog/assets/js/comments.js
const buildCommentTree = (comments) => {
    // 最初に全コメントをIDをキーにしたMapに格納 (計算量O(N))
    const commentMap = new Map(comments.map(c => [c.id, { ...c, children: [] }]));
    const tree = [];

    // 再度全コメントをループ (計算量O(N))
    for (const comment of commentMap.values()) {
        if (comment.parent_id && commentMap.has(comment.parent_id)) {
            // 親コメントが存在すれば，そのchildren配列に追加
            commentMap.get(comment.parent_id).children.push(comment);
        } else {
            // 親がいないコメントはルートレベルのコメントとしてtreeに追加
            tree.push(comment);
        }
    }
    return tree;
};
```

この方法なら，コメントリストを2回走査するだけで済むので，コメント数が多少増えてもパフォーマンスの悪化を抑えられるはず...

#### 認証トークン

コメント機能には管理者として投稿する機能も付けたかったので，簡単なログイン機能も実装しました．パスワードが一致したら，サーバーサイドでJWTを生成し，それをCookieに保存して返します．

```javascript
// server.js
app.post('/login', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
        // パスワードが一致したらJWTを生成
        const token = jwt.sign({ admin: true }, JWT_SECRET, { expiresIn: '8h' });
        res.cookie('token', token, {
            httpOnly: true, // JavaScriptからアクセス不可にする
            secure: false,
            sameSite: 'lax' // CSRF対策
        });
        res.json({ message: 'Login successful' });
    } else {
        res.status(401).json({ error: 'Invalid password' });
    }
});
```

以降，管理者権限が必要なAPIリクエストでは，リクエストのCookieからこのトークンを取り出して検証するミドルウェアをかませています．

```javascript
// server.js
const adminAuth = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }
    try {
        // トークンが秘密鍵で正しく署名されているか検証
        jwt.verify(token, JWT_SECRET);
        next(); // 検証成功
    } catch (err) {
        res.cookie('token', '', { expires: new Date(0) });
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
};

// 管理者用APIエンドポイントでミドルウェアを使用
app.delete('/admin/comments/:id', adminAuth, async (req, res) => {
  // ...削除処理...
});
```

この辺は初めてだったんでほぼGeminiに聞きました()JWTとかのセッション管理は全く意識したことなかったんでめちゃ興味深かったです．

## まとめ

こんな訳で何とか形になって良かったです．WPの頃は既存のテーマをダークテーマにしただけだったので，ここまでわがままな理想を忠実にしたのは初めてでめちゃ楽しかったです．子供の頃からの夢が叶ったような感動を味わえて[^00]，勉強にもなって中々美味しい思いができた体験でした．
[^00]: その頃よりはホスティングの敷居は遥かに低いが...

