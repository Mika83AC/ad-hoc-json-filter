export declare function filter(json: Array<jsonLikeObject>, filterExpressions: Array<expressionFilter | expressionConnector | expressionGroup>): Array<jsonLikeObject>;
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
    [key: string]: string | number | boolean | Array<jsonLikeObject> | null;
};
