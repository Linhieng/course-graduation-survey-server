DROP TABLE IF EXISTS user_message;
CREATE TABLE user_message
(
    id             INT AUTO_INCREMENT            NOT NULL COMMENT '主键，自增',
    user_id        INT                           NOT NULL COMMENT '该消息属于哪个用户',
    message_type   TINYINT      DEFAULT 1        NOT NULL COMMENT '消息类型， 1 表示新增一份回答。先这样吧',
    message_from   VARCHAR(100) DEFAULT 'system' NOT NULL COMMENT '消息发起者，默认是系统',
    content        VARCHAR(255)                  NOT NULL COMMENT '消息内容',
    survey_id      INT                           NOT NULL COMMENT '因为这个表我是用于通知用户某个问卷有了新的回答，所以添加问卷 id',
    answer_id      INT                           NOT NULL COMMENT '因为这个表我是用于通知用户某个问卷有了新的回答，所以添加回答 id',
    message_status TINYINT      DEFAULT 0        NOT NULL COMMENT '是否已读，0 表示未读，1 表示已读',
    created_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间，自动赋值',
    updated_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间，自动赋值',
    PRIMARY KEY (id), -- 主键添加在后面，更美观
    FOREIGN KEY (user_id) REFERENCES user (id)
) COMMENT = '用户消息表'
    ENGINE = InnoDB
    DEFAULT CHARSET = utf8mb4;







-- 答案收集时，添加一个字段，计算用户的 user_agent
ALTER TABLE questionnaire_answer
    ADD user_agent VARCHAR(255) DEFAULT '' NOT NULL COMMENT '由服务器进行添加，前端不需要添加。';
-- 这里添加一个字段后，旧数据似乎会自动提供默认值。









-- 这个表设计的有问题，用户想要获取自己的访问量时，没办法直接通过这个表来实现！
DROP TABLE IF EXISTS record_visit;
CREATE TABLE record_visit
(
    id         INT AUTO_INCREMENT  NOT NULL COMMENT '主键，自增',
    survey_id  INT                 NOT NULL COMMENT '访问的问卷 id，不设外键，因为可能没有',
    user_id    INT                 NOT NULL COMMENT '访问的用户，1 表示无登录',
    ip         VARCHAR(100)        NOT NULL COMMENT '用户所在 IP',
    user_agent VARCHAR(255)        NOT NULL COMMENT '浏览器的 user_agent 字符串',
    visit_type TINYINT   DEFAULT 0 NOT NULL COMMENT '访问的类型，没想好，直接为 0',
    method     VARCHAR(10)         NOT NULL COMMENT '访问的方法',
    router     VARCHAR(255)        NOT NULL COMMENT '访问的路由',
    info       VARCHAR(255)        NOT NULL COMMENT '备注',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间，自动赋值',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间，自动赋值',
    PRIMARY KEY (id), -- 主键添加在后面，更美观
    FOREIGN KEY (user_id) REFERENCES user (id)
) COMMENT = '访问统计表'
    ENGINE = InnoDB
    DEFAULT CHARSET = utf8mb4;







DROP TABLE IF EXISTS stat_count;
CREATE TABLE stat_count
(
    id           INT AUTO_INCREMENT NOT NULL COMMENT '主键，自增',
    survey_id    INT                NOT NULL COMMENT '外键，绑定问卷',
    count_visit  INT                NOT NULL COMMENT '访问次数，每获取一次链接就加 1',
    count_answer INT                NOT NULL COMMENT '每回答一次加加 1',
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间，自动赋值',
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间，自动赋值',
    PRIMARY KEY (id),                            -- 主键添加在后面，更美观
    FOREIGN KEY (survey_id) REFERENCES questionnaire (id) -- 外键，绑定 user id
) COMMENT = '问卷统计数据表'
    ENGINE = InnoDB
    DEFAULT CHARSET = utf8mb4;













DROP TABLE IF EXISTS user_action_log;
CREATE TABLE user_action_log
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
) COMMENT = '用户行为日志表'
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
