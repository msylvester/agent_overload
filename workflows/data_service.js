"use strict";
//we want to DUMP the collection on to the hosted mongodb atlas via atlas
//
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecords = getRecords;
var dotenv_1 = require("dotenv");
var mongodb_1 = require("mongodb");
var openai_1 = require("openai");
// Load environment variables from .env.local
(0, dotenv_1.config)({ path: '../.env.local' });
var uri = process.env.MONGODB_URI;
if (!uri) {
    throw new Error('MONGODB_URI is not defined in .env.local');
}
var client = new mongodb_1.MongoClient(uri);
// Initialize OpenAI client
var openaiClient = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY,
});
function getRecords() {
    return __awaiter(this, void 0, void 0, function () {
        var db, collection, records, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 6]);
                    return [4 /*yield*/, client.connect()];
                case 1:
                    _a.sent();
                    db = client.db("companies");
                    collection = db.collection("funded_companies");
                    return [4 /*yield*/, collection.find({}).toArray()];
                case 2:
                    records = _a.sent();
                    return [4 /*yield*/, client.close()];
                case 3:
                    _a.sent();
                    return [2 /*return*/, records];
                case 4:
                    e_1 = _a.sent();
                    return [4 /*yield*/, client.close()];
                case 5:
                    _a.sent();
                    throw new Error("Cannot get documents: ".concat(e_1));
                case 6: return [2 /*return*/];
            }
        });
    });
}
/**
 * makeEmbeddings -> loop through the records and create embeddings
 * Processes all company records and generates embeddings for each
 */
function makeEmbeddings() {
    return __awaiter(this, void 0, void 0, function () {
        var records, _i, records_1, record, id, company_name, description;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getRecords()];
                case 1:
                    records = _a.sent();
                    _i = 0, records_1 = records;
                    _a.label = 2;
                case 2:
                    if (!(_i < records_1.length)) return [3 /*break*/, 5];
                    record = records_1[_i];
                    id = record._id, company_name = record.company_name, description = record.description;
                    return [4 /*yield*/, embed(id, company_name, description)];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5: return [2 /*return*/];
            }
        });
    });
}
/**
 * embed - Generate embeddings for a company record
 * @param uid - MongoDB ObjectId of the document
 * @param company_name - Name of the company
 * @param description - Description of the company
 * @returns Object containing the document ID and embedding vector
 */
function embed(uid, company_name, description) {
    return __awaiter(this, void 0, void 0, function () {
        var response, embeddingVector, db, collection, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 8, , 9]);
                    // Validate inputs
                    if (!(company_name === null || company_name === void 0 ? void 0 : company_name.trim()) || !(description === null || description === void 0 ? void 0 : description.trim())) {
                        throw new Error('Company name and description are required and cannot be empty');
                    }
                    return [4 /*yield*/, openaiClient.embeddings.create({
                            model: 'text-embedding-3-small',
                            input: "Company: ".concat(company_name, " Description: ").concat(description),
                        })];
                case 1:
                    response = _a.sent();
                    embeddingVector = response.data[0].embedding;
                    // Connect to MongoDB and update the document
                    return [4 /*yield*/, client.connect()];
                case 2:
                    // Connect to MongoDB and update the document
                    _a.sent();
                    _a.label = 3;
                case 3:
                    _a.trys.push([3, , 5, 7]);
                    db = client.db('companies');
                    collection = db.collection('funded_companies');
                    return [4 /*yield*/, collection.updateOne({ _id: uid }, { $set: { embedding: embeddingVector } })];
                case 4:
                    _a.sent();
                    return [2 /*return*/, {
                            id: uid,
                            embedding: embeddingVector,
                        }];
                case 5: return [4 /*yield*/, client.close()];
                case 6:
                    _a.sent();
                    return [7 /*endfinally*/];
                case 7: return [3 /*break*/, 9];
                case 8:
                    error_1 = _a.sent();
                    console.error("Failed to create embedding for document ".concat(uid, ":"), error_1);
                    throw new Error("Embedding creation failed: ".concat(error_1 instanceof Error ? error_1.message : 'Unknown error'));
                case 9: return [2 /*return*/];
            }
        });
    });
}
function dumpRecords() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            try {
                // TODO: Implement record dumping logic
                return [2 /*return*/, {}];
            }
            catch (e) {
                throw new Error("there is an error ".concat(e));
            }
            return [2 /*return*/];
        });
    });
}
(function () { return __awaiter(void 0, void 0, void 0, function () {
    var _a, _b, _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                _b = (_a = console).log;
                _c = ["print this"];
                return [4 /*yield*/, makeEmbeddings()];
            case 1:
                _b.apply(_a, _c.concat([_d.sent()]));
                return [2 /*return*/];
        }
    });
}); })();
