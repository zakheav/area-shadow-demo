function deepCopy( object ) {
    var re;
    if( object instanceof Object == true ){
        if( object instanceof Array == true ){
            re = new Array(object.length);
            for( var i=0; i<object.length; ++i ){
                if( ( object[i] instanceof Object == true || object[i] instanceof Array == true ) && object[i] instanceof Function == false ){
                    re[i] = deepCopy( object[i] );
                } else{
                    re[i] = object[i];
                }
            }
        } else{
            re = {};
            for( var key in object ){
                if( ( object[key] instanceof Object == true || object[key] instanceof Array == true ) && object[key] instanceof Function == false ){
                    re[key] = deepCopy( object[key] );
                } else{
                    re[key] = object[key];
                }

            }
        }
    } else{
        re = object;
    }
    return re;
}



//多边形类
var Polygon = function( pointArr, c ){//c代表颜色

    //参数检查
    if( pointArr.length < 3 ){
        alert("not a polygon!");
        return;
    }

    /*私有属性*********************************************************************************************************/
    var pointArray = deepCopy(pointArr);//顶点数组(顺时针)
    var edgeArray = function (){//边数组(顺时针){x1,y1,x2,y2,k,n}
        var edgeArr = [];
        for( var i=0; i<pointArray.length; ++i ){
            var begin = i;
            var end = i+1 == pointArray.length ? 0 : i+1;
            var k;
            if( pointArray[begin].x == pointArray[end].x ){
                k = 999999;//k=99999以上表示斜率不存在
            } else{
                k = ( pointArray[begin].y - pointArray[end].y ) / ( pointArray[begin].x - pointArray[end].x );
            }
            edgeArr.push({ x1:pointArray[begin].x, y1:pointArray[begin].y, x2:pointArray[end].x, y2:pointArray[end].y, k:k });
        }

        //为每一条边计算向外的法向量
        for( i=0; i<edgeArr.length; ++i ){
            var n1, n2;
            if( edgeArr[i].y1 == edgeArr[i].y2 ){
                n1 = {x:0,y:1};
                n2 = {x:0,y:-1};
            } else{
                n1 = {x:1,y:-1/edgeArr[i].k};
                n2 = {x:-1,y:1/edgeArr[i].k};
            }//得到两个待选的法向量
            var edgeV = {x:edgeArr[i].x2-edgeArr[i].x1, y:edgeArr[i].y2-edgeArr[i].y1};//边顺时针方向向量
            //计算edgeV 叉乘 n1（n2），判断哪个法向量是朝外的
            if( edgeV.x*n1.y - edgeV.y*n1.x < 0 ){
                edgeArr[i].n = n1;
            } else{
                edgeArr[i].n = n2;
            }
        }
        return edgeArr;
    }();
    var color = c;
    /******************************************************************************************************************/

    /*对外接口*********************************************************************************************************/
    this.get_color = function(){ return color; };
    this.get_edgeArray = function(){ return deepCopy(edgeArray); };
    this.get_pointArray = function(){ return deepCopy(pointArray); };
    this.get_nextpoint = function( point, dir ){
        var now_index = -1;
        for( var i=0; i<pointArray.length; ++i ){
            if( pointArray[i].x == point.x && pointArray[i].y == point.y ){
                now_index = i;
            }
        }
        if( now_index == -1 ){
            return false;//所求点不存在
        } else{
            if( dir > 0 ){//顺时针
                if( now_index == pointArray.length-1 ){
                    return pointArray[0];
                } else{
                    return pointArray[now_index+1];
                }
            } else{
                if( now_index == 0 ){
                    return pointArray[ pointArray.length-1 ];
                } else{
                    return pointArray[now_index-1];
                }
            }
        }
    };//给出一个点，得到顺时针/逆时针的下一个点(dir = 1顺时针，-1逆时针)

    this.get_nextedge = function( edge, dir ){
        var now_index = -1;
        for( var i=0; i<edgeArray.length; ++i ){
            if(( edgeArray[i].x1 == edge.x2 && edgeArray[i].y1 == edge.y2 && edgeArray[i].x2 == edge.x1 && edgeArray[i].y2 == edge.y1)
             ||( edgeArray[i].x1 == edge.x1 && edgeArray[i].y1 == edge.y1 && edgeArray[i].x2 == edge.x2 && edgeArray[i].y2 == edge.y2 )){
                now_index = i;
            }
        }

        if( now_index == -1 ){//不存在所寻找的边
            return false;
        } else{
            if( dir > 0 ){//顺时针
                if( now_index == edgeArray.length-1 ){
                    return edgeArray[0];
                } else{
                    return edgeArray[now_index+1];
                }
            } else{//逆时针
                if( now_index == 0 ){
                    return edgeArray[ edgeArray.length-1 ];
                } else{
                    return edgeArray[ now_index - 1 ];
                }
            }
        }
    };//给出一条边，得到顺时针/逆时针的下一条边(dir = 1顺时针，-1逆时针)

    //********************************多边形填充
    var sort_AET = function(AET){
        var temp;
        for( var i=0; i<AET.length; ++i ){
            for( var j=0; j<AET.length-i-1; ++j ){
                if( AET[j].x > AET[j+1].x || ( AET[j].x == AET[j+1].x && AET[j].deltax > AET[j+1].deltax ) ){
                    temp = AET[j];
                    AET[j] = AET[j+1];
                    AET[j+1] = temp;
                }
            }
        }
    };//活化边表排序
    this.area_fill = function( context, color ){//传入canvas的上下文, 颜色格式color = "rgb(255,0,0)"
        var eArray = deepCopy(edgeArray);
        var pArray = deepCopy(pointArray);
        var i,j;
        //剔除掉水平的边,同时处理非极值奇点
        for( i=0; i<eArray.length; ++i ){
            if( eArray[i].y1 == eArray.y2 ){
                eArray.splice( i,1 );
            }
        }

        //处理非极值奇点
        for( i=0; i<pArray.length; ++i ){
            var p = [];
            for( j=0; j<eArray.length; ++j ){
                if( eArray[j].x1 == pArray[i].x && eArray[j].y1 == pArray[i].y ){
                    p.push({ x:eArray[j].x2, y:eArray[j].y2, index:j });
                } else if( eArray[j].x2 == pArray[i].x && eArray[j].y2 == pArray[i].y ){
                    p.push({ x:eArray[j].x1, y:eArray[j].y1, index:j });
                }
            }

            if(( p[0].y>pArray[i].y && p[1].y<pArray[i].y )||( p[0].y<pArray[i].y && p[1].y>pArray[i].y )){//是非极值奇点
                var below_edge_index = p[0].y < p[1].y ? p[0].index : p[1].index;//得到较低边的edgeArray的索引

                if( eArray[ below_edge_index ].x1 == pArray[i].x && eArray[ below_edge_index ].y1 == pArray[i].y ){
                    if( eArray[ below_edge_index ].k<99999 ){
                        eArray[ below_edge_index ].y1 = eArray[ below_edge_index ].y1 - 1;
                        eArray[ below_edge_index ].x1 = eArray[ below_edge_index ].x1 - 1/ eArray[ below_edge_index ].k;
                    } else{
                        eArray[ below_edge_index ].y1 = eArray[ below_edge_index ].y1 - 1;
                    }
                }
                if( eArray[ below_edge_index ].x2 == pArray[i].x && eArray[ below_edge_index ].y2 == pArray[i].y ){
                    if( eArray[ below_edge_index ].k<99999 ){
                        eArray[ below_edge_index ].y2 = eArray[ below_edge_index ].y2 - 1;
                        eArray[ below_edge_index ].x2 = eArray[ below_edge_index ].x2 - 1/ eArray[ below_edge_index ].k;
                    } else{
                        eArray[ below_edge_index ].y2 = eArray[ below_edge_index ].y2 - 1;
                    }
                }

            }
        }

        //建立边表ET
        //边表{ ymin, processed, nodeArray }
        //边表节点node { ymax, x, deltax, edge }
        var ET = new Array( 0 );
        for( i=0; i<eArray.length; ++i ){
            var ymax = eArray[i].y1 > eArray[i].y2 ? eArray[i].y1 : eArray[i].y2;
            var ymin = eArray[i].y1 > eArray[i].y2 ? eArray[i].y2 : eArray[i].y1;
            var x = eArray[i].y1 > eArray[i].y2 ? eArray[i].x2 : eArray[i].x1;
            var deltax = (eArray[i].x2 - eArray[i].x1)/(eArray[i].y2 - eArray[i].y1);

            //检查ET中是否含有ymin的组
            var inside = 0;
            for( j=0; j<ET.length; ++j ){
                if( ymin == ET[j].ymin ){
                    inside = 1;
                    //插入操作
                    ET[j].nodeArray.push({ ymax:ymax, x:x,  deltax:deltax, edge:eArray[i] });
                }
            }
            if( inside == 0 ){
                //添加操作
                ET.push( { ymin:ymin, processed:0, nodeArray:[{ ymax:ymax, x:x,  deltax:deltax, edge:eArray[i] }] } );
            }
        }

        //基于活化边表进行多边形扫描转化
        //AET中包含的每个元素的结构{ ymax, x, deltax }
        var AET = new Array(0);
        var min = 99999, etIndex = 0;
        for( i=0; i<ET.length; ++i ){
            if( ET[i].ymin < min ){
                min = ET[i].ymin;
                etIndex = i;
            }
        }
        ET[etIndex].processed = 1;//标记这一组边已经处理过
        var y = min;//初始化当前的扫描线的高度
        for( i=0; i<ET[etIndex].nodeArray.length; ++i ){
            AET.push({ ymax:ET[etIndex].nodeArray[i].ymax, x:ET[etIndex].nodeArray[i].x, deltax:ET[etIndex].nodeArray[i].deltax });
        }

        context.strokeStyle = color;
        while( AET.length > 0 ){
            //把AET中的边按照x排序（x相同时按照deltax排序）
            sort_AET( AET );
            for( i=1; i<AET.length; i = i+2 ){
                context.beginPath();
                context.moveTo(AET[i-1].x,y);
                context.lineTo(AET[i].x,y);
                context.stroke();
                context.closePath();
            }//AET中的两两配对，填充扫描线

            ++y;//扫描线上移
            for( i=0; i<AET.length; ++i ){
                AET[i].x = AET[i].x+AET[i].deltax;
            }//把AET中每条边的x进行修正

            for( i=0; i<AET.length; ++i ){
                if( AET[i].ymax < y ){
                    AET.splice( i,1 );
                    --i;
                }
            }//删除边

            //增加边
            etIndex = -1;
            for( i=0; i<ET.length; ++i ){
                if( ET[i].ymin == y && ET[i].processed == 0 ){
                    etIndex = i;
                }
            }
            if( etIndex != -1 ){
                for( i=0; i<ET[etIndex].nodeArray.length; ++i ){
                    AET.push({ ymax:ET[etIndex].nodeArray[i].ymax, x:ET[etIndex].nodeArray[i].x, deltax:ET[etIndex].nodeArray[i].deltax });
                }//增加边完毕
            }
        }
    };
    this.polygonFill = function(context){
        for( var i=0; i<4; ++i ){
            this.area_fill( context, "rgb(255,255,255)" );
        }
        this.area_fill( context, this.get_color() );
    };
    //********************************多边形填充部分完毕


    this.insect = function( begin, end ){//输入射线的起点，终点；返回相交点insectPoint的列表 和 对应的相交的边的列表
        var insectPointList = [];
        var insectEdgeList = [];//待返回的交点和交点所在边

        var a1,b1,c1;//射线所在直线 a1*x + b1*y + c1 = 0
        //斜率不存在
        if( Math.abs( begin.x - end.x ) < 0.0001 ){
            a1 = 1;
            b1 = 0;
            c1 = 0-begin.x;

        } else{//斜率存在
            if(Math.abs( end.x*begin.y - end.y*begin.x ) < 0.0001 ){//截距存在
                c1 = 0;
                b1 = 1;
                if( Math.abs( begin.x - 0 ) > 0.0001 ){
                    a1 = begin.y/(0-begin.x);
                } else{
                    a1 = end.y/(0-end.x);
                }
            } else{//截距存在
                c1 = 100;
                b1 = c1*(begin.x-end.x)/( begin.y*end.x-begin.x*end.y );
                if(  Math.abs( begin.x - 0 ) > 0.0001 ){
                    a1 = (b1*begin.y+c1)/(0-begin.x);
                } else{
                    a1 = (b1*end.y+c1)/(0-end.x);
                }
            }
        }

        for( var i=0; i<edgeArray.length; ++i ){
            var a2,b2,c2;//边所在直线 a2*x + b2*y + c2 = 0
            //斜率不存在
            if( Math.abs( edgeArray[i].x1 - edgeArray[i].x2 ) < 0.0001 ){
                a2 = 1;
                b2 = 0;
                c2 = 0-edgeArray[i].x1;
            } else{//斜率存在
                if( Math.abs( edgeArray[i].x2*edgeArray[i].y1 - edgeArray[i].y2*edgeArray[i].x1 ) < 0.0001 ){//截距不存在
                    c2 = 0;
                    b2 = 1;
                    if( Math.abs( edgeArray[i].x1 - 0 ) > 0.0001 ){
                        a2 = edgeArray[i].y1/(0-edgeArray[i].x1);
                    } else{
                        a2 = edgeArray[i].y2/(0-edgeArray[i].x2);
                    }
                } else{//截距存在

                    c2 = 100;
                    b2 = c2*(edgeArray[i].x1-edgeArray[i].x2)/( edgeArray[i].y1*edgeArray[i].x2-edgeArray[i].x1*edgeArray[i].y2 );
                    if(  Math.abs( edgeArray[i].x1 - 0 ) > 0.0001 ){
                        a2 = (b2*edgeArray[i].y1+c2)/(0-edgeArray[i].x1);
                    } else{
                        a2 = (b1*edgeArray[i].y2+c2)/(0-edgeArray[i].x2);
                    }

                }
            }

            //先求出所在直线之间的交点（规定两个重合的直线没有交点，简化情况）
            if( Math.abs(a1*b2-a2*b1) > 0.000001 ){//两直线不平行且不重合

                var insectPoint = {};
                //计算出直线之间的交点
                insectPoint.y = (a1*c2-a2*c1)/(a2*b1-a1*b2);
                if( a1 != 0 ){
                    insectPoint.x = (c1+b1*insectPoint.y)/(0-a1);
                } else{
                    insectPoint.x = (c2+b2*insectPoint.y)/(0-a2);
                }

                var in_it = 0;//1表示在射线内，2表示在射线和多边形线段内
                //验证交点是否在射线内
                if( begin.x == end.x ){
                    if( begin.y < end.y ){//射线是向上的
                        if( insectPoint.y > begin.y ){
                            in_it = 1;
                        }
                    } else{//射线是向下的
                        if( insectPoint.y < begin.y ){
                            in_it = 1;
                        }
                    }
                } else{
                    if( begin.x < end.x ){//射线向右
                        if( insectPoint.x > begin.x ){
                            in_it = 1;
                        }
                    } else{//射线向左
                        if( insectPoint.x < begin.x ){
                            in_it = 1;
                        }
                    }
                }
                if( in_it == 1 ) {//验证交点是否在线段内
                    if( edgeArray[i].x1 == edgeArray[i].x2 ){
                        if( ( insectPoint.y >= edgeArray[i].y1 && insectPoint.y <= edgeArray[i].y2 )||( insectPoint.y <= edgeArray[i].y1 && insectPoint.y >= edgeArray[i].y2 ) ){
                            in_it = 2;
                        }
                    } else{
                        if( ( insectPoint.x >= edgeArray[i].x1 && insectPoint.x <= edgeArray[i].x2 )||( insectPoint.x <= edgeArray[i].x1 && insectPoint.x >= edgeArray[i].x2 ) ){
                            in_it = 2;
                        }
                    }
                }

                if( in_it == 2 ){//该点确实是射线与边的交点
                    insectPoint.x = parseInt(insectPoint.x);
                    insectPoint.y = parseInt(insectPoint.y);
                    insectPointList.push( insectPoint );
                    insectEdgeList.push( edgeArray[i] );
                }
            }
        }
        return { insectPointList:insectPointList, insectEdgeList:insectEdgeList }
    };
    /******************************************************************************************************************/
};