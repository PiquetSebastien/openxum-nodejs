"use strict";

Dvonn.Engine = function (t, c) {

// public methods
    this.can_move = function (coordinates) {
        var intersection = intersections[coordinates.hash()];
        var size = intersection.size();
        var direction = Dvonn.Direction.NORTH_WEST;
        var stop = false;
        var found = false;

        while (!stop && !found) {
            var neighbor = coordinates.move(size, direction);

            if (neighbor.is_valid()) {
                found = intersections[neighbor.hash()].state() === Dvonn.State.NO_VACANT;
            } else {
                found = true;
            }
            if (direction === Dvonn.Direction.WEST) {
                stop = true;
            } else {
                direction = next_direction(direction);
            }
        }
        return found;
    };

    this.change_color = function () {
        if (phase === Dvonn.Phase.MOVE_STACK) {
            if ((color === Dvonn.Color.BLACK && this.get_possible_moving_stacks(Dvonn.Color.WHITE).length > 0) ||
                (color === Dvonn.Color.WHITE && this.get_possible_moving_stacks(Dvonn.Color.BLACK).length > 0)) {
                color = this.next_color(color);
            }
        } else {
            color = this.next_color(color);
        }
    };

    this.current_color = function () {
        return color;
    };

    this.exist_intersection = function (letter, number) {
        var coordinates = new Dvonn.Coordinates(letter, number);

        if (coordinates.is_valid()) {
            return intersections[coordinates.hash()] != null;
        } else {
            return false;
        }
    };

    this.get_free_intersections = function () {
        var list = [];

        for (var index in intersections) {
            var intersection = intersections[index];

            if (intersection.state() === Dvonn.State.VACANT) {
                list.push(intersection.coordinates());
            }
        }
        return list;
    };

    this.get_intersection = function (letter, number) {
        return intersections[(new Dvonn.Coordinates(letter, number)).hash()];
    };

    this.get_intersections = function () {
        return intersections;
    };

    this.phase = function () {
        return phase;
    };

    this.get_possible_moving_stacks = function (color) {
        var list = [];

        for (var index in intersections) {
            var intersection = intersections[index];

            if (intersection.state() === Dvonn.State.NO_VACANT && intersection.color() === color) {
                if (!(intersection.size() === 1 && intersection.dvonn())) {
                    if (this.can_move(intersection.coordinates()) &&
                        this.get_stack_possible_move(intersection.coordinates()).length > 0) {
                        list.push(intersection.coordinates());
                    }
                }
            }
        }
        return list;
    };

    this.get_stack_possible_move = function (origin) {
        if (this.can_move(origin)) {
            var list = [];
            var intersection = intersections[origin.hash()];
            var size = intersection.size();
            var direction = Dvonn.Direction.NORTH_WEST;
            var stop = false;

            while (!stop) {
                var destination = origin.move(size, direction);

                if (destination.is_valid()) {
                    var destination_it = intersections[destination.hash()];

                    if (destination_it.state() === Dvonn.State.NO_VACANT) {
                        list.push(destination);
                    }
                }
                if (direction === Dvonn.Direction.WEST) {
                    stop = true;
                } else {
                    direction = next_direction(direction);
                }
            }
            return list;
        }
    };

    this.get_state = function () {
        return state;
    };

    this.is_finished = function () {
        return phase === Dvonn.Phase.MOVE_STACK &&
            this.get_possible_moving_stacks(Dvonn.Color.WHITE).length == 0 &&
            this.get_possible_moving_stacks(Dvonn.Color.BLACK).length == 0;
    };

    this.move_no_stack = function () {
        this.change_color();
    };

    this.move_stack = function (origin, destination) {
        var origin_it = intersections[origin.hash()];
        var destination_it = intersections[destination.hash()];

        origin_it.move_stack_to(destination_it);
        this.change_color();
    };

    this.next_color = function (c) {
        return c === Dvonn.Color.BLACK ? Dvonn.Color.WHITE : Dvonn.Color.BLACK;
    };

    this.put_dvonn_piece = function (coordinates) {
        if (coordinates.hash() in intersections) {
            var intersection = intersections[coordinates.hash()];

            if (intersection.state() === Dvonn.State.VACANT) {
                intersection.put_piece(Dvonn.Color.RED);
                placedDvonnPieceNumber++;
                if (placedDvonnPieceNumber === 3) {
                    phase = Dvonn.Phase.PUT_PIECE;
                }
            }
        }
        this.change_color();
    };

    this.put_piece = function (coordinates, color) {
        if (coordinates.hash() in intersections) {
            if (intersections[coordinates.hash()].state() === Dvonn.State.VACANT) {
                intersections[coordinates.hash()].put_piece(color);
                placedPieceNumber++;
                if (placedPieceNumber === 46) {
                    phase = Dvonn.Phase.MOVE_STACK;
                } else {
                    this.change_color();
                }
            }
        }
    };

    this.remove_isolated_stacks = function () {
        var list = [];

        for (var index in intersections) {
            var intersection = intersections[index];

            if (intersection.state() === Dvonn.State.NO_VACANT && !intersection.dvonn()) {
                if (!is_connected(intersection.coordinates())) {
                    list.push(intersection.coordinates());
                }
            }
        }
        this.remove_stacks(list);
        return list;
    };

    this.remove_stacks = function (list) {
        for (var index in list) {
            intersections[list[index].hash()].remove_stack();
        }
    };

    this.verify_moving = function (origin, destination) {
        if (this.can_move(origin)) {
            var list = this.get_stack_possible_move(origin);

            for (var index in list) {
                if (list[index].hash() === destination.hash()) {
                    return true;
                }
            }
            return false;
        } else {
            return false;
        }
    };

    this.winner_is = function () {
        if (this.is_finished()) {
            return color;
        } else {
            return false;
        }
    };

// private methods
    var get_max_stack_size = function (color) {
        var max = 0;

        for (var index in intersections) {
            var intersection = intersections[index];

            if (intersection.state() === Dvonn.State.NO_VACANT && intersection.color() === color) {
                if (intersection.size() > max) {
                    max = intersection.size();
                }
            }
        }
        return max;
    };

    var is_connected = function (coordinates) {
        var checking_list = [];
        var checked_list = [];
        var found = false;

        checking_list.push(coordinates);
        while (checking_list.length > 0 && !found) {
            var current_coordinates = checking_list[checking_list.length - 1];
            var intersection = intersections[current_coordinates.hash()];

            checked_list.push(current_coordinates);
            checking_list.pop();
            if (intersection.dvonn()) {
                found = true;
            } else {
                var direction = Dvonn.Direction.NORTH_WEST;
                var stop = false;

                while (!stop) {
                    var destination = current_coordinates.move(1, direction);

                    if (destination.is_valid()) {
                        var destination_it = intersections[destination.hash()];

                        if (destination_it.state() === Dvonn.State.NO_VACANT) {
                            var found2 = false;

                            for (var index in checked_list) {
                                if (checked_list[index].hash() === destination.hash()) {
                                    found2 = true;
                                    break;
                                }
                            }
                            if (!found2) {
                                checking_list.push(destination);
                            }
                        }
                    }
                    if (direction === Dvonn.Direction.WEST) {
                        stop = true;
                    } else {
                        direction = next_direction(direction);
                    }
                }
            }
        }
        return found;
    };

    var next_direction = function (direction) {
        if (direction === Dvonn.Direction.NORTH_WEST) {
            return Dvonn.Direction.NORTH_EAST;
        } else if (direction === Dvonn.Direction.NORTH_EAST) {
            return Dvonn.Direction.EAST;
        } else if (direction === Dvonn.Direction.EAST) {
            return Dvonn.Direction.SOUTH_EAST;
        } else if (direction === Dvonn.Direction.SOUTH_EAST) {
            return Dvonn.Direction.SOUTH_WEST;
        } else if (direction === Dvonn.Direction.SOUTH_WEST) {
            return Dvonn.Direction.WEST;
        } else if (direction === Dvonn.Direction.WEST) {
            return Dvonn.Direction.NORTH_WEST;
        }
    };

    var init = function (t, c) {
        type = t;
        color = c;
        placedDvonnPieceNumber = 0;
        placedPieceNumber = 0;
        phase = Dvonn.Phase.PUT_DVONN_PIECE;
        intersections = [];
        for (var i = 0; i < Dvonn.letters.length; ++i) {
            var l = Dvonn.letters[i];

            for (var n = Dvonn.begin_number[l.charCodeAt(0) - 'A'.charCodeAt(0)];
                 n <= Dvonn.end_number[l.charCodeAt(0) - 'A'.charCodeAt(0)]; ++n) {
                var coordinates = new Dvonn.Coordinates(l, n);

                intersections[coordinates.hash()] = new Dvonn.Intersection(coordinates);
            }
        }
    };

// private attributes
    var type;
    var color;
    var intersections;

    var phase;
    var state;
    var placedDvonnPieceNumber;
    var placedPieceNumber;

    init(t, c);
};
