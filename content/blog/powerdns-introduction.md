+++
title = 'Powerdns Introduction'
date = '2025-08-30T12:36:08Z'
#lastmod = '2025-08-30T12:36:08Z'
categories = ['']
tags = ['']
draft = true
description = ""
image = ""
+++
宅内の名前解決を，Unboundの`local-data`で管理していたのですが，所有するドメインをもっと本格的に色々弄ってみたくなり，最近勢いがあるというPowerDNSを導入してみました．
<!--more-->
## 現状と目標
### 環境
今回DNS鯖にするのは，ProxmoxVE(以下，PVE)上のLXCコンテナ(Rocky Linux)で，1コア，1GBメモリです．

```
[root@dns ~]# lscpu
Architecture:                x86_64
  CPU op-mode(s):            32-bit, 64-bit
  Address sizes:             39 bits physical, 48 bits virtual
  Byte Order:                Little Endian
CPU(s):                      4
  On-line CPU(s) list:       1
  Off-line CPU(s) list:      0,2,3
~~中略~~~
[root@dns ~]# free -h
               total        used        free      shared  buff/cache   available
Mem:           1.0Gi       459Mi       338Mi       8.0Mi       234Mi       564Mi
Swap:             0B          0B          0B
[root@dns ~]# cat /etc/os-release
NAME="Rocky Linux"
VERSION="9.6 (Blue Onyx)"
ID="rocky"
~~中略~~~
```
## なぜPowerDNSか
今回行いたいのは，キャッシュサーバで簡易的に行っていた，ローカルの名前解決を別の権威サーバに担わせてゾーン管理をモダンなものにするという事です．
DNSサーバと言えばBINDでしたが，PowerDNSはBINDがテキストでゾーンを管理するのに対してDBを使うことで，APIや管理画面の実装が容易かつ，リアルタイムに設定を適用できるようになったらしいです．(その分設定は複雑ですが...)

## 移行に際して
当然，宅内の名前解決の全てをUnboundに任せている関係上，落ちたら家族にシバかれるのでダウンタイムは0が望まれます．先述の通り，PVE上にあるためこの点は比較的容易です．
私の場合．
1. Proxmox Backup Serverにデータをストア(元々バックアップしているためスキップ)
2. 1のデータを異なるVMIDでリストア
3. サーバのipを適宜変更(LXCコンテナだとGUIからできて楽ですね)
で，ダウンタイムはLXCコンテナの起動時間だけで済みました．2台構成で冗長性をとれば可用性100%だし本来はそうするべきですが...


