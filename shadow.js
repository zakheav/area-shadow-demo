/**
 * Created by origin on 2015/11/30.
 */
var draw_shadow = function( context, polygon, frame, light ){//context是canvas的上下文，polygon是多边形变量，frame是画框对应的多边形，light是光源坐标{x，y}
    var darkEdgesPoints = [];

    var polyEdgeArr = polygon.get_edgeArray();
    var polyPointArr = polygon.get_pointArray();
    var frameEdgeArr = frame.get_edgeArray();
    var framePointArr = frame.get_pointArray();
    var i;


    var nowEdge = polyEdgeArr[0];
    var endEdge = polygon.get_nextedge(polyEdgeArr[0],-1);
    var incidentLight;
    var normalVector;

    //为了防止起初的背光边被数组起始分割开，需要逆时针寻找一下
    incidentLight = { x:light.x - polyEdgeArr[0].x1, y:light.y-polyEdgeArr[0].y1 };
    normalVector = polyEdgeArr[0].n;
    if( incidentLight.x*normalVector.x + incidentLight.y*normalVector.y <= 0 ){
        for( var finish=0; finish!=1; ){
            nowEdge = polygon.get_nextedge(nowEdge,-1);
            incidentLight = { x:light.x - nowEdge.x1, y:light.y-nowEdge.y1 };
            normalVector = nowEdge.n;
            if( incidentLight.x*normalVector.x + incidentLight.y*normalVector.y <= 0 ){
                darkEdgesPoints.unshift({x:nowEdge.x1, y:nowEdge.y1});
            } else{
                finish = 1;
                endEdge = nowEdge;//记录下搜索的结尾边
            }
        }
    }

    var newDarkEdgeGroup = 1;
    nowEdge = polygon.get_nextedge( polyEdgeArr[0] , -1 );
    var shadowPolygonList = [];//存储需要绘制的阴影多边形
    for( finish = 0; finish != 1; ){
        nowEdge = polygon.get_nextedge(nowEdge,1);
        incidentLight = { x:light.x - nowEdge.x1, y:light.y-nowEdge.y1 };
        normalVector = nowEdge.n;
        if( incidentLight.x*normalVector.x + incidentLight.y*normalVector.y <= 0 ){
            if( newDarkEdgeGroup == 1 ){
                darkEdgesPoints.push({x:nowEdge.x1, y:nowEdge.y1});
                newDarkEdgeGroup = 0;
            }
            darkEdgesPoints.push( {x:nowEdge.x2, y:nowEdge.y2} );//加入一条背光边的顶点（顺时针方向）
        } else{
            if( darkEdgesPoints.length != 0 ){//得到一条完整的背光边
                //执行相关操作
                var shadowPolygon = shadowAreaAnalysis( darkEdgesPoints, polygon, frame, light );
                shadowPolygonList.push( shadowPolygon );
                darkEdgesPoints = [];
                newDarkEdgeGroup = 1;
            }
        }

        if( nowEdge.x1 == endEdge.x1 && nowEdge.y1 == endEdge.y1 && nowEdge.x2 == endEdge.x2 && nowEdge.y2 == endEdge.y2 ){//已经搜索到了终边
            finish = 1;
            if( darkEdgesPoints.length != 0 ){
                shadowPolygon = shadowAreaAnalysis( darkEdgesPoints, polygon, frame, light );
                shadowPolygonList.push( shadowPolygon );
            }
        }
    }
    for( i=0; i<shadowPolygonList.length; ++i ){
        shadowPolygonList[i].polygonFill(context);
    }
};

var shadowAreaAnalysis = function( darkEdgesPoints, polygon, frame, light ){//阴影区域分析 darkEdgesPoints是顺时针存放的背光边的顶点，polygon是多边形， frame是画框多边形，light是光源
    var shadowAreaPolygon;//待返回的阴影区域多边形
    var insect1 = frame.insect( light, darkEdgesPoints[darkEdgesPoints.length-1] );
    var insect2 = frame.insect( light, darkEdgesPoints[0] );//阴影区域由光源引出的两条边界和画框的焦点


    darkEdgesPoints.push( deepCopy( insect1.insectPointList[0] ) );

    //判断应该沿着画框顺时针还是逆时针走，为direction赋值 1顺时针 -1逆时针
    var direction = 0;//画框方向
    var insectEdge1 = insect1.insectEdgeList[0];
    var insectEdge2 = insect2.insectEdgeList[0];
    if( insectEdge1.y1 == insectEdge1.y2 ){//水平边
        //构造一条检测光线
        if( polygon.insect(light,{x:insect1.insectPointList[0].x-10, y:insect1.insectPointList[0].y}).insectPointList.length > 0 ){
            if( insectEdge1.y1 == 0 ){
                direction = -1;
            } else{
                direction = 1;
            }
        } else{
            if( insectEdge1.y1 == 0 ){
                direction = 1;
            } else{
                direction = -1;
            }
        }
    } else{//竖直边
        //构造一条检测光线
        if( polygon.insect(light,{x:insect1.insectPointList[0].x, y:insect1.insectPointList[0].y-10}).insectPointList.length > 0 ){
            if( insectEdge1.x1 == 0 ){
                direction = 1;
            } else{
                direction = -1;
            }
        } else{
            if( insectEdge1.x1 == 0 ){
                direction = -1;
            } else{
                direction = 1;
            }
        }
    }//direction赋值完毕

    var nowEdge = insectEdge1;
    while(!( nowEdge.x1 == insectEdge2.x1 && nowEdge.y1 == insectEdge2.y1 && nowEdge.x2 == insectEdge2.x2 && nowEdge.y2 == insectEdge2.y2 )){
        if( direction == 1 ){
            darkEdgesPoints.push( {x:nowEdge.x2, y:nowEdge.y2} );
        } else{
            darkEdgesPoints.push( {x:nowEdge.x1, y:nowEdge.y1} );
        }
        nowEdge = frame.get_nextedge(nowEdge,direction);
    }
    darkEdgesPoints.push(deepCopy( insect2.insectPointList[0] ));

    shadowAreaPolygon = new Polygon( darkEdgesPoints, "rgb(23,23,23)" );
    return shadowAreaPolygon;
};
