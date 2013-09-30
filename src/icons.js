define([
        'lib/text!icons/point.svg',
        'lib/text!icons/polyline.svg',
        'lib/text!icons/cube.svg',
        'lib/text!icons/sphere.svg',
        'lib/text!icons/cylinder.svg',
        'lib/text!icons/cone.svg',
        'lib/text!icons/subtract.svg',
        'lib/text!icons/intersect.svg',
        'lib/text!icons/union.svg',
        'lib/text!icons/cog.svg',
        'lib/text!icons/tag.svg',
        'lib/text!icons/save.svg',
        'lib/text!icons/list.svg',
        'lib/text!icons/workplane.svg',
    ], 
    function(
        point, 
        polyline,
        cube,
        sphere,
        cylinder,
        cone,
        subtract,
        intersect,
        union,
        cog,
        tag,
        save,
        list,
        workplane) {

    return {
        point    : point, 
        polyline : polyline,
        cube     : cube,
        sphere   : sphere,
        cylinder : cylinder,
        cone     : cone,
        subtract : subtract,
        intersect: intersect,
        union    : union,
        cog      : cog,
        tag      : tag,
        save     : save,
        list     : list,
        workplane: workplane,
    }

});