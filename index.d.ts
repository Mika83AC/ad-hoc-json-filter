export declare function filter(data: Array<jsonLikeObject>, filterExpression: Array<expressionFilter | expressionConnector | expressionGroup>): Array<unknown>;
export type expressionFilter = {
    key: string;
    op: "=" | "!=" | "<" | "<=" | ">" | ">=" | "cont";
    val: string | number | boolean | null;
};
export type expressionConnector = {
    con: "&&" | "||";
};
export type expressionGroup = {
    grp: "(" | ")";
};
export type jsonLikeObject = {
    [key: string]: string | number | boolean | Array<unknown> | null;
};
