export declare function filter(data: Array<unknown>, filterExpression: Array<expressionFilter | expressionConnector | expressionGroup>): Array<unknown>;
export type expressionFilter = {
    key: string;
    op: "=" | "!=" | "<" | "<=" | ">" | ">=" | "cont";
    val: string | number | Date | boolean | null;
};
export type expressionConnector = {
    con: "&&" | "||";
};
export type expressionGroup = {
    grp: "(" | ")";
};
