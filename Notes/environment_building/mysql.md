# MySQL 笔记

## MySQL 配置

使用 MySQL 官方的 Compressed TAR Archive 在 Ubuntu 24.04 上部署。
下载 `mysql-26.7.0-linux-glibc2.28-x86_64.tar.xz` 。

### 1. MySQL 下载

在官网下载后解压到选定文件夹，这里位置为 `/home/user_name/computer/mysql/mysql-26.7.0` 。

### 2. 环境变量配置

和 jdk、maven 一样，先在系统全局变量写好 `MYSQL_HOME` ，再在 `.bashrc` 写 `export` 。

在终端输入 `sudo nano /etc/environment` 写入：

```shell
MYSQL_HOME="/home/user_name/computer/mysql/mysql-26.7.0"
```

然后在 `.bashrc` 中追加如下指令:

```shell
export PATH="$JAVA_HOME/bin:$MAVEN_HOME/bin:$MYSQL_HOME/bin:$PATH"
```

### 3. libaio 库的问题

尝试初始化，输入 `mysqld --initialize-insecure` 报错：

```shell
sudo apt install -y libaio1t64
mysqld: error while loading shared libraries: libaio.so.1: cannot open shared object file: No such file or directory
```

使用 `apt` 命令装 `libaio1` ，提示：

```shell
E: 软件包 libaio1 没有可安装候选
```

查证后发现，24.04 为了 64 位 `time_t` 过渡把一批包统一改了名，`libaio1` 变成了 `libaio1t64` 。但是 mysqld 要的是 `libaio.so.1` ，Ubuntu 24.04 里已经没了。

解决办法是手动补一个软链接：

```bash
sudo ln -s /usr/lib/x86_64-linux-gnu/libaio.so.1t64 /usr/lib/x86_64-linux-gnu/libaio.so.1
```

也可以不动系统目录，直接把库放进 mysql 自带的 `lib/private` （mysqld 的 RUNPATH 就指向这里），复制时改名为 `libaio.so.1` 即可。

再输入 `mysqld --version` ，正常出现版本号：

```shell
/home/user_name/computer/mysql/mysql-26.7.0/bin/mysqld  Ver 26.7.0 for Linux on x86_64 (MySQL Community Server - GPL)
```

### 4. 初始化数据目录

```bash
mysqld --initialize-insecure
```

执行完 `data` 目录会被创建出来，里面是 `mysql`、`sys` 等系统库。

### 5. 启动与连接

启动 mysql 服务：

```bash
mysqld --daemonize
```

> 若要退出 MySQL 服务可输入：mysqladmin -uroot -p shutdown

另开一个终端连接：

```bash
mysql -uroot # 如果有密码，则在后面加 `-p`
```

空密码直接回车进入 `mysql>` 。

输入 `exit` 回车后退出 mysql ，输入以下命令修改默认密码：

```shell
mysqladmin -uroot password 'your_password' # 如果有密码在 root 后加 -p
```

现在就可以正常使用 mysql 了。
若有远程网络数据库需要连接， mysql 连接语法为:

```shell
mysql -u用户名 -p密码 [ -h数据库服务器ip地址 -P端口号] # []内为非必要命令
```
