DROP TABLE IF EXISTS user_login_log;
CREATE TABLE user_login_log
(
    id         INT AUTO_INCREMENT      NOT NULL COMMENT '主键，自增',
    user_id    INT                     NOT NULL COMMENT '外键，绑定 user id',
    ip         VARCHAR(100)            NOT NULL COMMENT '登录 IP',
    user_agent VARCHAR(255)            NOT NULL COMMENT '请求头中的 User-Agent',
    info       VARCHAR(255)            NOT NULL COMMENT '其他一些信息，描述日志内容',
    origin     VARCHAR(255) DEFAULT '' NOT NULL COMMENT '请求头中的 origin',
    referer    VARCHAR(255) DEFAULT '' NOT NULL COMMENT '请求头中的 referer',
    platform   VARCHAR(255) DEFAULT '' NOT NULL COMMENT '登录平台，Window 啥的',
    created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间，自动赋值',
    updated_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间，自动赋值',
    PRIMARY KEY (id),                          -- 主键添加在后面，更美观
    FOREIGN KEY (user_id) REFERENCES user (id) -- 外键，绑定 user id
) COMMENT = '用户登录日志表'
    ENGINE = InnoDB
    DEFAULT CHARSET = utf8mb4;











DROP TABLE IF EXISTS user_info;
CREATE TABLE user_info
(
    id                  INT AUTO_INCREMENT      NOT NULL COMMENT '主键，自增',
    `account_id`        INT                     NOT NULL COMMENT '外键，绑定 user id',
    `name`              VARCHAR(100) DEFAULT '' NOT NULL COMMENT '姓名',
    `avatar`        VARCHAR(255) DEFAULT '' NOT NULL COMMENT '头像地址',
    `email`             VARCHAR(255) DEFAULT '' NOT NULL COMMENT '邮箱',
    `job`               VARCHAR(100) DEFAULT '' NOT NULL COMMENT '职业，如 frontend',
    `job_name`          VARCHAR(255) DEFAULT '' NOT NULL COMMENT '职业名称，如前端艺术家',
    `organization`      VARCHAR(100) DEFAULT '' NOT NULL COMMENT '组织，如 frontend',
    `organization_name` VARCHAR(100) DEFAULT '' NOT NULL COMMENT '组织名称，如前端',
    `location`          VARCHAR(100) DEFAULT '' NOT NULL COMMENT '地址，如 beijing',
    `location_name`     VARCHAR(100) DEFAULT '' NOT NULL COMMENT '地址，如 北京',
    `introduction`      VARCHAR(255) DEFAULT '' NOT NULL COMMENT '个人介绍',
    `personal_website`  VARCHAR(255) DEFAULT '' NOT NULL COMMENT '个人网站',
    `phone`             VARCHAR(20)  DEFAULT '' NOT NULL COMMENT '电话号码',
    `certification`     TINYINT(1)   DEFAULT 0  NOT NULL COMMENT '身份是否已认证',
    `role`              TINYINT(1)   DEFAULT 1  NOT NULL COMMENT '0 表示 admin；1 表示 user 用于权限管理',
    `registration_date` DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间，自动赋值',
    created_at          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间，自动赋值',
    updated_at          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间，自动赋值',
    PRIMARY KEY (id),                             -- 主键添加在后面，更美观
    FOREIGN KEY (account_id) REFERENCES user (id) -- 外键，绑定 user id
) COMMENT = '用户信息表'
    ENGINE = InnoDB
    DEFAULT CHARSET = utf8mb4;

INSERT INTO user_info (account_id, name, avatar, email, job, job_name, organization, organization_name, location,
                       location_name, introduction, personal_website, phone, certification, role)
    VALUE (
           1, '匿名', 'https://pic.imgdb.cn/item/6304358116f2c2beb15e9a9b.jpg',
           'a@oonoo.cn', '', '', '', '', '', '', '', 'http://oonoo.cn', '', 1, 1
    );
