// These orders describe observable compositions, rather than imagined flavor ratings.
export const RECIPE_ORDERS=[
 {id:'breakfast',title:'早餐搭档',brief:'热奶咖，牛奶多一些，约 200 g。',range:[170,260],milk:'more',temp:'hot',story:'早餐桌上，想让牛奶成为这一杯的主角。'},
 {id:'window',title:'窗边的长杯',brief:'热黑咖，不加奶，180–270 g。',range:[180,270],milk:'none',temp:'hot',story:'给阅读留一杯慢慢喝的黑咖啡。'},
 {id:'kitchen',title:'厨房来客',brief:'摩卡原液，70–110 g，不再加水。',range:[70,110],milk:'none',original:true,temp:'hot',story:'用一份摩卡原液，招待来厨房做客的朋友。'},
 {id:'share',title:'双人分享',brief:'同一份基底，两杯不同搭配；每杯 90–200 g。',range:[90,200],two:true,milk:'any',temp:'hot',story:'同一锅咖啡，你想给两个人做出怎样的不同？'},
 {id:'ice',title:'清爽冰咖',brief:'冰黑咖，不加奶，180–280 g。',range:[180,280],milk:'none',temp:'iced',story:'午后想要一杯加冰的黑咖啡。'},
 {id:'foam',title:'泡沫早餐',brief:'牛奶与奶泡都加入，180–260 g。',range:[180,260],milk:'some',foam:true,temp:'hot',story:'试试让牛奶和奶泡一起加入咖啡。'},
 {id:'bar',title:'吧台小杯',brief:'小杯摩卡原液，30–80 g。',range:[30,80],milk:'none',original:true,temp:'hot',story:'只保留摩卡原液，给吧台一杯短暂停留。'},
 {id:'small',title:'自己的小杯',brief:'热黑咖，100–170 g，比例由你。',range:[100,170],milk:'none',temp:'hot',story:'少一点，浓淡的配方由你选择。'}
];
