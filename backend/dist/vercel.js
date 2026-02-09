"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
async function default_1(req, res) {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: '*',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        preflightContinue: false,
        optionsSuccessStatus: 204,
    });
    await app.init();
    const instance = app.getHttpAdapter().getInstance();
    return instance(req, res);
}
//# sourceMappingURL=vercel.js.map