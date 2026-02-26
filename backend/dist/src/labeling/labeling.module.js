"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LabelingModule = void 0;
const common_1 = require("@nestjs/common");
const labeling_service_1 = require("./labeling.service");
let LabelingModule = class LabelingModule {
};
exports.LabelingModule = LabelingModule;
exports.LabelingModule = LabelingModule = __decorate([
    (0, common_1.Module)({
        providers: [labeling_service_1.LabelingService],
        exports: [labeling_service_1.LabelingService],
    })
], LabelingModule);
//# sourceMappingURL=labeling.module.js.map