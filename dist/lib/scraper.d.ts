export interface DiscoveredArticle {
    title: string;
    url: string;
    description: string;
}
export declare function discoverArticles(blogUrl: string): Promise<DiscoveredArticle[]>;
export declare function fetchArticleContent(articleUrl: string): Promise<string>;
