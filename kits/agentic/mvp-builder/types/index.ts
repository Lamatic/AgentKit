export type Feature = {
  feature_name: string;
  feature_description: string;
};

export type Table = {
  name: string;
  fields: string[];
};

export type Route = {
  method: string;
  path: string;
};

export type Plan = {
  type: 'web_app' | 'mobile_app' | 'extension' | 'api_service';
  features: Feature[];
  database: {
    tables: Table[];
  };
  api: {
    routes: Route[];
  };
  structure: {
    frontend: string[];
    backend: string[];
  };
  tech_stack: {
    frontend: string;
    backend: string;
    database: string;
    auth: string;
    deployment: string;
  };
  summary: string;
};
