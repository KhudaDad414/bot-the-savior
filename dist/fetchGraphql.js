"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("@octokit/graphql");
function fetchGraphql(query) {
    const parameters = {
        headers: {
            authorization: `token ${process.env.GITHUB_TOKEN}`,
        },
    };
    return (0, graphql_1.graphql)(query, parameters);
}
exports.default = fetchGraphql;
