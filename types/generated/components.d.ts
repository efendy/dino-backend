import type { Schema, Struct } from '@strapi/strapi';

export interface GlobalOperationInfo extends Struct.ComponentSchema {
  collectionName: 'components_global_operation_infos';
  info: {
    displayName: 'Operation Info';
    icon: 'calendar';
  };
  attributes: {
    Jumat: Schema.Attribute.String & Schema.Attribute.DefaultTo<'Tutup'>;
    Kamis: Schema.Attribute.String & Schema.Attribute.DefaultTo<'Tutup'>;
    Minggu: Schema.Attribute.String & Schema.Attribute.DefaultTo<'Tutup'>;
    Rabu: Schema.Attribute.String & Schema.Attribute.DefaultTo<'Tutup'>;
    Sabtu: Schema.Attribute.String & Schema.Attribute.DefaultTo<'Tutup'>;
    Selasa: Schema.Attribute.String & Schema.Attribute.DefaultTo<'Tutup'>;
    Senin: Schema.Attribute.String & Schema.Attribute.DefaultTo<'Tutup'>;
  };
}

export interface GlobalShopAddress extends Struct.ComponentSchema {
  collectionName: 'components_global_shop_addresses';
  info: {
    displayName: 'Shop Address';
    icon: 'pinMap';
  };
  attributes: {
    Locality: Schema.Attribute.String;
    Number: Schema.Attribute.String;
    Postal: Schema.Attribute.String;
    Street: Schema.Attribute.String;
    Type: Schema.Attribute.String;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'global.operation-info': GlobalOperationInfo;
      'global.shop-address': GlobalShopAddress;
    }
  }
}
