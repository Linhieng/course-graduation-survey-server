-- 名称统一使用单数，别问为什么，单复数之争是不重要，重要的是统一。
-- 非要问我问什么的话，那就是中文根本没有复数。

DROP DATABASE IF EXISTS survey;
CREATE DATABASE survey
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE survey;

DROP TABLE IF EXISTS user;
CREATE TABLE user
(
    id            INT AUTO_INCREMENT      NOT NULL COMMENT '主键，自增',
    username      VARCHAR(50)             NOT NULL COMMENT '用户名，唯一',
    email         VARCHAR(100) DEFAULT '' NOT NULL COMMENT '邮箱，可选',
    password_hash VARCHAR(255)            NOT NULL COMMENT '加密后的密码（使用 SHA256 进行加密）',
    status        TINYINT      DEFAULT 0  NOT NULL COMMENT '账户状态。0 表示正常状态；1 表示被封禁；-1 是专门匿名用户服务的，无法登录',
    user_type     TINYINT      DEFAULT 0  NOT NULL COMMENT '用户类型。0 表示注册用户；1 表示管理员；-1 是专门匿名用户服务的',
    created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间，自动赋值',
    updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间，自动赋值',
    PRIMARY KEY (id),                -- 主键添加在后面，能上 datagrip 自动进行格式对齐，这样更美观
    UNIQUE INDEX username (username) -- 唯一索引添加在后面，理由同上
) COMMENT = '所有用户表；'
    ENGINE = InnoDB
    DEFAULT CHARSET = utf8mb4;

-- 插入匿名用户
INSERT INTO user(username, password_hash, status, user_type)
    VALUE ('', '', -1, -1);



DROP TABLE IF EXISTS questionnaire;
CREATE TABLE questionnaire
(
    id         INT AUTO_INCREMENT       NOT NULL COMMENT '主键，自增',
    title      VARCHAR(50)              NOT NULL COMMENT '问卷标题',
    comment    VARCHAR(1024) DEFAULT '' NOT NULL COMMENT '问卷备注信息',
    sort_order INT           DEFAULT 0  NOT NULL COMMENT '问卷排序优先级。0 的优先级最低，表示按时间排序',
    creator_id INT                      NOT NULL COMMENT '问卷创建者',
    is_draft   TINYINT       DEFAULT 1  NOT NULL COMMENT '是否是草稿。0 为否；1 为是。只能从 1 变成 0，因为问卷一经发布不能撤回。如果需要停止发布，请修改 is_valid',
    is_valid   TINYINT       DEFAULT 0  NOT NULL COMMENT '问卷是否还有效/是否可以继续收集，0 为否；1 为是',
    is_deleted TINYINT       DEFAULT 0  NOT NULL COMMENT '问卷是否已被删除（回收站）。0 为否；1 为是',
    created_at TIMESTAMP     DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间，自动赋值',
    updated_at TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间，自动赋值',
    PRIMARY KEY (id) -- 主键添加在后面，更美观
) COMMENT = '问卷通用基本信息表；注意该表中不存储问卷已收集的回答数量；'
    ENGINE = InnoDB
    DEFAULT CHARSET = utf8mb4;



DROP TABLE IF EXISTS questionnaire_constrain;
CREATE TABLE questionnaire_constrain
(
    id               INT AUTO_INCREMENT  NOT NULL COMMENT '主键，自增',
    questionnaire_id INT                 NOT NULL COMMENT '该约束所属问卷的 id',
    is_anonymity     TINYINT   DEFAULT 0 NOT NULL COMMENT '是否匿名收集。0 为否；1 为是',
    force_login      TINYINT   DEFAULT 0 NOT NULL COMMENT '是否强制登录才能回答。0 为否；1 为是',
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间，自动赋值',
    updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间，自动赋值',
    PRIMARY KEY (id), -- 主键添加在后面，更美观
    FOREIGN KEY (questionnaire_id) REFERENCES questionnaire (id)
) COMMENT = '问卷约束表；'
    ENGINE = InnoDB
    DEFAULT CHARSET = utf8mb4;



DROP TABLE IF EXISTS questionnaire_answer;
CREATE TABLE questionnaire_answer
(
    id               INT AUTO_INCREMENT      NOT NULL COMMENT '主键，自增',
    questionnaire_id INT                     NOT NULL COMMENT '该回答所属问卷的 id',
    answer_user_id   INT          DEFAULT -1 NOT NULL COMMENT '回答的用户。-1 表示匿名用户',
    is_valid         TINYINT      DEFAULT 1  NOT NULL COMMENT '该回答是否有效。0 为无效；1 为有效。通常是用户将每个回答标记为无效',
    spend_time       INT          DEFAULT -1 NOT NULL COMMENT '添加问卷花费的时间（单位秒），-1 表示不统计',
    ip_from          VARCHAR(256) DEFAULT '' NOT NULL COMMENT '用户回答时的 IP 地址，可选',
    created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间，自动赋值',
    updated_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间，自动赋值',
    PRIMARY KEY (id), -- 主键添加在后面，更美观
    FOREIGN KEY (questionnaire_id) REFERENCES questionnaire (id),
    FOREIGN KEY (answer_user_id) REFERENCES user (id)
) COMMENT = '问卷回答基本信息表；更多信息请存储在详细信息中的 json 字段中。'
    ENGINE = InnoDB
    DEFAULT CHARSET = utf8mb4;



DROP TABLE IF EXISTS questionnaire_detail;
CREATE TABLE questionnaire_detail
(
    id               INT AUTO_INCREMENT NOT NULL COMMENT '主键，自增',
    questionnaire_id INT                NOT NULL COMMENT '所属问卷 id',
    structure_json   JSON               NOT NULL COMMENT '问卷结构存储为 json 字符串，如何解析是前端负责的工作。',
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间，自动赋值',
    updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间，自动赋值',
    PRIMARY KEY (id), -- 主键添加在后面，更美观
    FOREIGN KEY (questionnaire_id) REFERENCES questionnaire (id)
) COMMENT = '问卷具体内容表。除非问卷未发布，否则该元组的内容不允许变更。发布后如果想要修改时，请新建一个问卷。'
    ENGINE = InnoDB
    DEFAULT CHARSET = utf8mb4;



DROP TABLE IF EXISTS questionnaire_answer_detail;
CREATE TABLE questionnaire_answer_detail
(
    id             INT AUTO_INCREMENT NOT NULL COMMENT '主键，自增',
    answer_id      INT                NOT NULL COMMENT '所属回答 id',
    structure_json JSON               NOT NULL COMMENT '回答结构存储为 json 格式，如何解析是前端负责的工作。',
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间，自动赋值',
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间，自动赋值',
    PRIMARY KEY (id), -- 主键添加在后面，更美观
    FOREIGN KEY (answer_id) REFERENCES questionnaire_answer (id)
) COMMENT = '问卷回答具体内容表。一旦提交，不可修改。对于已登录用户，若想修改，也是通过新建一份回答的方式。至于数据的统计，也是由前端负责解析数据并统计'
    ENGINE = InnoDB
    DEFAULT CHARSET = utf8mb4;
