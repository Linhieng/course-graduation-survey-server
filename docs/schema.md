# 数据库表的设计

> 具体的表设计，请直接查看 survey.sql 文件，文件的格式很漂亮，很容易阅读。

问卷系统的用户主要有两类，一类是管理员用户，一类是注册用户。目前，管理员用户仅仅用做保留，通常是对已注册的用户进行管理，除此之外没有其他功能，因为它暂时不是问卷系统的核心模块。主要需要考虑的是注册用户，他们可以创建问卷和收集问卷信息。

对于问卷本身的设计，我的想法是这样。问卷本身有一些通用信息，这一块就设计成表的字段，至于用户创建出来的问卷结构，由于这一块的内容多种多样，而且后续也可能添加新的设计，所以考虑不记录结构，而是之间存储字符串，比如之间存储成 json 字符串。具体如何解析交给前端负责。

同样的，收集的问卷回答也是这样，每一条回答都有基本的通用信息，这些信息就设计成表的字段，至于回答的具体内容，同样也是之间存储为字符串，比如 json 字符串。具体如何解析交给前端负责。

## mysql 表设计原则

- 每张表都应该有三个通用的部分：

  - `id`: 主键
  - `created_at`: 创建时间
  - `updated_at`: 修改时间

- 每个字段都应该限制为 `NOT NULL`
- 不要使用枚举类型
- 使用 TINYINT 类型代替 BOOLEAN 类型

## 表的说明

一张用户表 user
一份问卷表 questionnaire
    问卷约束表 questionnaire_constrain
    问卷的 JSON 内容表 questionnaire_detail
一份问卷回答表 questionnaire_answer
    问卷的 JSON 格式的回答表 questionnaire_answer_detail
