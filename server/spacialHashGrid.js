const math = (function () {
    return {
        rand_range: function (a, b) {
            return Math.random() * (b - a) + a;
        },

        rand_normalish: function () {
            const r = Math.random() + Math.random() + Math.random() + Math.random();
            return (r / 4.0) * 2.0 - 1;
        },

        rand_int: function (a, b) {
            return Math.round(Math.random() * (b - a) + a);
        },

        lerp: function (x, a, b) {
            return x * (b - a) + a;
        },

        smoothstep: function (x, a, b) {
            x = x * x * (3.0 - 2.0 * x);
            return x * (b - a) + a;
        },

        smootherstep: function (x, a, b) {
            x = x * x * x * (x * (x * 6 - 15) + 10);
            return x * (b - a) + a;
        },

        clamp: function (x, a, b) {
            return Math.min(Math.max(x, a), b);
        },

        sat: function (x) {//only give values between 0 and 1
            return Math.min(Math.max(x, 0.0), 1.0);
        },
    };
})();

class SpacialHashGrid {
    constructor(gridDimensions, cellDimensions) {
        const [x, y, z] = cellDimensions;
        //null will be the nodes(linked list)
        this._cells = [...Array(x)].map(_ => [...Array(y)].map(_ => ([...Array(z)].map(_ => (undefined)))));//Empty array of arrays //dont need to check if cell exists anymore
        this._cellDimensions = cellDimensions;
        this._gridDimensions = gridDimensions;
        this._queryIds = 0;
    }

    _GetCellIndex(position) {
        //                 position relative to width                 /    width of hash grid  => value between 0 and 1
        const x = math.sat((position[0] - this._gridDimensions[0][0]) / (this._gridDimensions[1][0] - this._gridDimensions[0][0]));
        const y = math.sat((position[1] - this._gridDimensions[0][1]) / (this._gridDimensions[1][1] - this._gridDimensions[0][1]));
        const z = math.sat((position[2] - this._gridDimensions[0][2]) / (this._gridDimensions[1][2] - this._gridDimensions[0][2]));
        return [
            Math.floor(x * (this._cellDimensions[0] - 1)),
            Math.floor(y * (this._cellDimensions[1] - 1)),
            Math.floor(z * (this._cellDimensions[2] - 1))
        ];
    }

    AddComponent(component) {
        component.cells = {
            min: null,
            max: null,
            nodes: null,
        }
        component._queryId = -1;
        this._Insert(component);
    }

    _Insert(component) {
        const [x, y, z] = [
            component.matrix.elements[12],
            component.matrix.elements[13],
            component.matrix.elements[14]];
        const [w, h, d] = component.dimensions;

        const ciMin = this._GetCellIndex([x - w / 2, y - h / 2, z - d / 2]);
        const ciMax = this._GetCellIndex([x + w / 2, y + h / 2, z + d / 2]);

        const nodes = [];//linked list nodes for component

        //add component to every cell it touches
        for (let x = ciMin[0], xn = ciMax[0]; x <= xn; ++x) {
            nodes.push([]);
            for (let y = ciMin[1], yn = ciMax[1]; y <= yn; ++y) {
                const xi = x - ciMin[0];//so xi starts at 0
                nodes[xi].push([]);
                for (let z = ciMin[2], zn = ciMax[2]; z <= zn; ++z) {
                    const yi = y - ciMin[1];//so yi starts at 0

                    const head = {//new (head)node in linked list
                        next: null,
                        prev: null,
                        component: component,
                    };

                    nodes[xi][yi].push(head);//goes into component

                    head.next = this._cells[x][y][z];//gets the head (first node in linked list from cell) and sets new head next to old head
                    if (this._cells[x][y][z]) {
                        this._cells[x][y][z].prev = head;//set prev of old head to new head if exists
                    }

                    this._cells[x][y][z] = head;//new head
                }
            }
        }

        component.cells.min = ciMin;
        component.cells.max = ciMax;
        component.cells.nodes = nodes;//for remove to know where to remove
    }

    UpdateComponent(component) {
        const [x, y, z] = [
            component.matrix.elements[12],
            component.matrix.elements[13],
            component.matrix.elements[14]];//center position of component
        const [w, h, d] = component.dimensions;//size of component

        const ciMin = this._GetCellIndex([x - w / 2, y - h / 2, z - d / 2]);//top left front
        const ciMax = this._GetCellIndex([x + w / 2, y + h / 2, z + d / 2]);//bottom right back

        //only do an update if component has moved to another cell
        if (component.cells.min[0] === ciMin[0] &&
            component.cells.min[1] === ciMin[1] &&
            component.cells.min[2] === ciMin[2] &&
            component.cells.max[0] === ciMax[0] &&
            component.cells.max[1] === ciMax[1] &&
            component.cells.max[2] === ciMax[2]) {
            return;
        }

        //this could be better
        this.RemoveComponent(component);
        this._Insert(component);
    }

    FindNear(component, bounds) {
        const [x, y, z] = [
            component.matrix.elements[12],
            component.matrix.elements[13],
            component.matrix.elements[14]];//center position of component;
        const [w, h, d] = bounds;

        const ciMin = this._GetCellIndex([x - w / 2, y - h / 2, z - d / 2]);
        const ciMax = this._GetCellIndex([x + w / 2, y + h / 2, z + d / 2]);

        const components = [];
        const queryId = this._queryIds++;//new unique query ids

        for (let x = ciMin[0], xn = ciMax[0]; x <= xn; ++x) {
            for (let y = ciMin[1], yn = ciMax[1]; y <= yn; ++y) {
                for (let z = ciMin[2], zn = ciMax[2]; z <= zn; ++z) {
                    let head = this._cells[x][y][z];

                    while (head) {
                        const v = head.component;
                        head = head.next;

                        if (v._queryId != queryId) {//remove duplicates
                            v._queryId = queryId;
                            components.push(v);
                        }
                    }
                }
            }
        }
        return components;
    }

    RemoveComponent(component) {
        const ciMin = component.cells.min;
        const ciMax = component.cells.max;

        for (let x = ciMin[0], xn = ciMax[0]; x <= xn; ++x) {
            for (let y = ciMin[1], yn = ciMax[1]; y <= yn; ++y) {
                for (let z = ciMin[2], zn = ciMax[2]; z <= zn; ++z) {
                    const xi = x - ciMin[0];
                    const yi = y - ciMin[1];
                    const zi = z - ciMin[2];
                    const node = component.cells.nodes[xi][yi][zi];

                    if (node.next) {
                        node.next.prev = node.prev;
                    }
                    if (node.prev) {
                        node.prev.next = node.next;
                    }

                    if (!node.prev) {
                        this._cells[x][y][z] = node.next;
                    }
                }
            }
        }

        component.cells.min = null;
        component.cells.max = null;
        component.cells.nodes = null;
    }
}

export default SpacialHashGrid;