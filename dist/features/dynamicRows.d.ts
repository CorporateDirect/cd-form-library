export interface DynamicRowGroup {
    groupName: string;
    container: Element;
    template: Element;
    namePattern: string;
    rows: Element[];
    addButton: Element | null;
}
export declare function initDynamicRows(): void;
export declare function initializeDynamicRowGroup(groupName: string, container: Element): void;
export declare function reinitializeDynamicRowGroup(groupName: string, container: Element): void;
