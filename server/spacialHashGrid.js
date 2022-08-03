/*

const grid = new SpacialHashGrid(x,y);
const client = grid.newClient();
client.position = new Position
grid.updateClient(client);

const nearby = grid.findNearBy(lcoaiton, bounnds);
grid.removeClient(client)

*/
// ####################################################

class SpatialHash_Fast {
    constructor(bounds, dimensions) {
        const [x, y] = dimensions;
        //null will be the nodes(linked list)
        this._cells = [...Array(x)].map(_ => [...Array(y)].map(_ => (null)));//Empty array of arrays //dont need to check if cell exists anymore
        this._dimensions = dimensions; //size of hashgrid [[-1000.0, -1000.0], [1000.0, 1000.0]]
        this._bounds = bounds; //cell size [100,100]
        this._queryIds = 0;
    }

    _GetCellIndex(position) {
        const x = math.sat((position[0] - this._bounds[0][0]) / (
            this._bounds[1][0] - this._bounds[0][0]));
        const y = math.sat((position[1] - this._bounds[0][1]) / (
            this._bounds[1][1] - this._bounds[0][1]));

        const xIndex = Math.floor(x * (this._dimensions[0] - 1));
        const yIndex = Math.floor(y * (this._dimensions[1] - 1));

        return [xIndex, yIndex];
    }

    NewClient(position, dimensions) {
        const client = {
            position: position, //center position of client [54,345]
            dimensions: dimensions, //size of client [15,15]
            _cells: {
                min: null,
                max: null,
                nodes: null,
            },
            _queryId: -1,
        };

        this._Insert(client);

        return client;
    }

    _Insert(client) {
        const [x, y] = client.position;
        const [w, h] = client.dimensions;

        const i1 = this._GetCellIndex([x - w / 2, y - h / 2]);
        const i2 = this._GetCellIndex([x + w / 2, y + h / 2]);

        const nodes = [];//linked list nodes for client

        //add client to every cell it touches
        for (let x = i1[0], xn = i2[0]; x <= xn; ++x) {
            nodes.push([]);

            for (let y = i1[1], yn = i2[1]; y <= yn; ++y) {
                const xi = x - i1[0];

                const head = {//new node in linked list
                    next: null,
                    prev: null,
                    client: client,
                };

                nodes[xi].push(head);//goes into client

                head.next = this._cells[x][y];//gets the head (first node in linked list from cell) and sets new head next to old head
                if (this._cells[x][y]) {
                    this._cells[x][y].prev = head;//set prev of old head to new head if exists
                }

                this._cells[x][y] = head;//new head
            }
        }

        client._cells.min = i1;
        client._cells.max = i2;
        client._cells.nodes = nodes;//for remove to know where to remove
    }

    UpdateClient(client) {
        const [x, y] = client.position;//center position of client
        const [w, h] = client.dimensions;//size of client

        const i1 = this._GetCellIndex([x - w / 2, y - h / 2]);//min top left
        const i2 = this._GetCellIndex([x + w / 2, y + h / 2]);//max bottom right

        //only do an update if client has moved to another cell
        if (client._cells.min[0] == i1[0] &&
            client._cells.min[1] == i1[1] &&
            client._cells.max[0] == i2[0] &&
            client._cells.max[1] == i2[1]) {
            return;
        }

        //this could be better
        this.Remove(client);
        this._Insert(client);
    }

    FindNear(position, bounds) {
        const [x, y] = position;
        const [w, h] = bounds;

        const i1 = this._GetCellIndex([x - w / 2, y - h / 2]);
        const i2 = this._GetCellIndex([x + w / 2, y + h / 2]);

        const clients = [];
        const queryId = this._queryIds++;//new unique query ids

        for (let x = i1[0], xn = i2[0]; x <= xn; ++x) {
            for (let y = i1[1], yn = i2[1]; y <= yn; ++y) {
                let head = this._cells[x][y];

                while (head) {
                    const v = head.client;
                    head = head.next;

                    if (v._queryId != queryId) {//remove duplicates
                        v._queryId = queryId;
                        clients.push(v);
                    }
                }
            }
        }
        return clients;
    }

    Remove(client) {
        const i1 = client._cells.min;
        const i2 = client._cells.max;

        for (let x = i1[0], xn = i2[0]; x <= xn; ++x) {
            for (let y = i1[1], yn = i2[1]; y <= yn; ++y) {
                const xi = x - i1[0];
                const yi = y - i1[1];
                const node = client._cells.nodes[xi][yi];

                if (node.next) {
                    node.next.prev = node.prev;
                }
                if (node.prev) {
                    node.prev.next = node.next;
                }

                if (!node.prev) {
                    this._cells[x][y] = node.next;
                }
            }
        }

        client._cells.min = null;
        client._cells.max = null;
        client._cells.nodes = null;
    }
}
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

export default SpacialHashGrid;

/*

const grid = new SpacialHashGrid(x,y);
const client = grid.newClient();
client.position = new Position
grid.updateClient(client);

const nearby = grid.findNearBy(lcoaiton, bounnds);
grid.removeClient(client)

*/
// ####################################################

class SpatialHash_Fast {
    constructor(bounds, dimensions) {
        const [x, y] = dimensions;
        //null will be the nodes(linked list)
        this._cells = [...Array(x)].map(_ => [...Array(y)].map(_ => (null)));//Empty array of arrays //dont need to check if cell exists anymore
        this._dimensions = dimensions; //size of hashgrid [[-1000.0, -1000.0], [1000.0, 1000.0]]
        this._bounds = bounds; //cell size [100,100]
        this._queryIds = 0;
    }

    _GetCellIndex(position) {
        const x = math.sat((position[0] - this._bounds[0][0]) / (
            this._bounds[1][0] - this._bounds[0][0]));
        const y = math.sat((position[1] - this._bounds[0][1]) / (
            this._bounds[1][1] - this._bounds[0][1]));

        const xIndex = Math.floor(x * (this._dimensions[0] - 1));
        const yIndex = Math.floor(y * (this._dimensions[1] - 1));

        return [xIndex, yIndex];
    }

    NewClient(position, dimensions) {
        const client = {
            position: position, //center position of client [54,345]
            dimensions: dimensions, //size of client [15,15]
            _cells: {
                min: null,
                max: null,
                nodes: null,
            },
            _queryId: -1,
        };

        this._Insert(client);

        return client;
    }

    _Insert(client) {
        const [x, y] = client.position;
        const [w, h] = client.dimensions;

        const i1 = this._GetCellIndex([x - w / 2, y - h / 2]);
        const i2 = this._GetCellIndex([x + w / 2, y + h / 2]);

        const nodes = [];//linked list nodes for client

        //add client to every cell it touches
        for (let x = i1[0], xn = i2[0]; x <= xn; ++x) {
            nodes.push([]);

            for (let y = i1[1], yn = i2[1]; y <= yn; ++y) {
                const xi = x - i1[0];

                const head = {//new node in linked list
                    next: null,
                    prev: null,
                    client: client,
                };

                nodes[xi].push(head);//goes into client

                head.next = this._cells[x][y];//gets the head (first node in linked list from cell) and sets new head next to old head
                if (this._cells[x][y]) {
                    this._cells[x][y].prev = head;//set prev of old head to new head if exists
                }

                this._cells[x][y] = head;//new head
            }
        }

        client._cells.min = i1;
        client._cells.max = i2;
        client._cells.nodes = nodes;//for remove to know where to remove
    }

    UpdateClient(client) {
        const [x, y] = client.position;//center position of client
        const [w, h] = client.dimensions;//size of client

        const i1 = this._GetCellIndex([x - w / 2, y - h / 2]);//min top left
        const i2 = this._GetCellIndex([x + w / 2, y + h / 2]);//max bottom right

        //only do an update if client has moved to another cell
        if (client._cells.min[0] == i1[0] &&
            client._cells.min[1] == i1[1] &&
            client._cells.max[0] == i2[0] &&
            client._cells.max[1] == i2[1]) {
            return;
        }

        //this could be better
        this.Remove(client);
        this._Insert(client);
    }

    FindNear(position, bounds) {
        const [x, y] = position;
        const [w, h] = bounds;

        const i1 = this._GetCellIndex([x - w / 2, y - h / 2]);
        const i2 = this._GetCellIndex([x + w / 2, y + h / 2]);

        const clients = [];
        const queryId = this._queryIds++;//new unique query ids

        for (let x = i1[0], xn = i2[0]; x <= xn; ++x) {
            for (let y = i1[1], yn = i2[1]; y <= yn; ++y) {
                let head = this._cells[x][y];

                while (head) {
                    const v = head.client;
                    head = head.next;

                    if (v._queryId != queryId) {//remove duplicates
                        v._queryId = queryId;
                        clients.push(v);
                    }
                }
            }
        }
        return clients;
    }

    Remove(client) {
        const i1 = client._cells.min;
        const i2 = client._cells.max;

        for (let x = i1[0], xn = i2[0]; x <= xn; ++x) {
            for (let y = i1[1], yn = i2[1]; y <= yn; ++y) {
                const xi = x - i1[0];
                const yi = y - i1[1];
                const node = client._cells.nodes[xi][yi];

                if (node.next) {
                    node.next.prev = node.prev;
                }
                if (node.prev) {
                    node.prev.next = node.next;
                }

                if (!node.prev) {
                    this._cells[x][y] = node.next;
                }
            }
        }

        client._cells.min = null;
        client._cells.max = null;
        client._cells.nodes = null;
    }
}

const math1 = (function () {
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

export default SpatialHash_Fast;

let size = 100000;

let array = [];
for (let i = 0; i < size; i++) {
    array[i] = { i : Math.random()};
}

// let object = {};
// for (let i = 0; i < size; i++) {
//     object["" + i] = Math.random();
// }

// const map1 = new Map();
// for (let i = 0; i < size; i++) {
//     map1.set("" + i, Math.random());
// }

let t0 = window.performance.now();

// for (let i = 0; i < size; i++) {
//     let element = array[i];
//     element = element + 1;
// }

let element = array[7654465];

console.log(element, window.performance.now() - t0);//2.8000001907348633

// t0 = window.performance.now();
// for (let i = 0; i < size; i++) {
//     let element = object["" + i];
//     element = element + 1;
// }
// console.log(window.performance.now() - t0);//45.09999990463257

// t0 = window.performance.now();
// for (let i = 0; i < size; i++) {
//     let element = map1.get("" + i);
//     element = element + 1;
// }
// console.log(window.performance.now() - t0);//45.09999990463257
