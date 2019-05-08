# CERTIFICATE MANAGER - WECHAT
竞赛证书上传与审核系统
> CODING...
## Description
微信小程序客户端。面向学生用户提供服务。  
## Build
1. 配置文件
```bash
cp miniprogram/config.ts.example miniprogram/config.ts
```
执行此命令，从配置文件模版复制一份文件，并酌情修改。
```typescript
{
    prefix: string,     //在token中添加标记前缀
    serverURL: string   //配置后端API服务器的URL，详细格式见模版示例
}
```