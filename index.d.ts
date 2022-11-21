export declare function filter(json: Array<unknown>, filterExpressions: Array<expressionFilter | expressionConnector | expressionGroup>): Array<unknown>;
export type expressionFilter = {
    key: string;
    op: '=' | '!=' | '<' | '<=' | '>' | '>=' | 'cont';
    val: string | number | boolean | null | undefined;
};
export type expressionConnector = {
    con: '&&' | '||';
};
export type expressionGroup = {
    grp: '(' | ')';
};
