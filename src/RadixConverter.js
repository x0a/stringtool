import React, { Component } from 'react';
import {
  Button, Card, CardText, CardTitle
} from "reactstrap";

import memoizeOne from 'memoize-one';

class RadixConverter extends Component {
  constructor(props) {
    super(props);

    this.edit = this.edit.bind(this);
    this.addRef = this.addRef.bind(this);
    this.setHover = this.setHover.bind(this);

    if (props.radix !== undefined) {
      this.radix = ~~props.radix;
    } else {
      this.radix = 10;
    }

    if (this.radix === -1) {
      this.radixName = "UTF-8";
      this.description = "Translation of binary Unicode code points"
    } else if (this.radix === 0) {
      this.radixName = "Text"
    } else if (this.radix === 2) {
      this.radixName = "Binary";
    } else if (this.radix === 8) {
      this.radixName = "Octal";
    } else if (this.radix === 10) {
      this.radixName = "Decimal";
    } else if (this.radix === 16) {
      this.radixName = "Hexadecimal";
    }

    this.children = [];

    this.memoizeInputProp = memoizeOne((input) => {
      this.prevHover = -1;
      this.prevSelect = -1;
      this.setState({ input: this.convert(input, this.radix) })
    });

    this.state = {
      input: this.convert(props.input || [], this.radix)
    };
  }

  componentWillReceiveProps(newProps) {
    this.memoizeInputProp(newProps.input);
  }

  setSelect(select) {
    if (this.prevSelect !== -1) {
      this.children[this.prevSelect].classList.remove("select");
      this.prevSelect = -1;
    }

    if (select !== -1) {
      this.prevSelect = select;
      this.children[select].classList.add("select");
    }
  }

  setHover(hover) {
    if (this.prevHover !== -1) {
      this.children[this.prevHover].classList.remove("hover");
      this.prevHover = -1;
    }
    
    if (hover !== -1) {
      this.prevHover = hover;
      this.children[hover].classList.add("hover");
    }
  }

  convert(numbers, to) {
    return numbers.map(digit => {
      if (typeof digit === "number" && isNaN(digit))
        return "NaN";
      else if (to > 0)
        return RadixConverter.convertBase(digit, 10, to)
      else if (to === 0)
        return String.fromCharCode(digit);
      else if (to === -1) {
        let digits = this.dec2utf8(digit);

        if (digits instanceof Array)
          return digits.map(number => number.toString(2).padStart(8, "0")).join(" ");
        else
          return "NaN";
      }
    })
  }
  // lot of research and tinkering went into this shit.., for a performance gain of about 60%
  // but it was still rewarding
  dec2utf8(number) {
    if (isNaN(number) || number < 0)
      return NaN;
    else if (number < 0x80) // 7 bits or less
      return [number];
    else if (number < 0x800) // 11 bits or less
      return [((number >> 6) & 0x3f) | 0xc0, (number & 0x3f) | 0x80];
    else if (number < 0x10000) // 16 bits or less
      return [((number >> 12) & 0x3f) | 0xe0, ((number >> 6) & 0x3f) | 0x80, (number & 0x3f) | 0x80];
    else if (number < 0x200000) // 21 bits or less
      return [((number >> 18) & 0x3f) | 0xf0, ((number >> 12) & 0x3f) | 0x80, ((number >> 6) & 0x3f) | 0x80, (number & 0x3f) | 0x80];
    else
      return NaN;
  }

  static convertBase(number, from, to) {
    const codetable = [
      "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", // Using an array here makes this function
      "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", // nearly 60% faster than a string
      "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", // at least for binary values.
      "U", "V", "W", "X", "Y", "Z"
    ];

    if (isNaN(number) && typeof number === "number") return NaN;

    if (from === 10) {
      number = parseInt(number, 10);

      if (to === 10) return number;
      if (codetable.length < to || number < 0) return NaN;

      let digits = [];

      do {
        let remainder = number % to;
        digits.push(codetable[remainder]);
        number = (number - remainder) / to;
      } while (number !== 0)

      return digits.reverse().join("");
    } else if (to === 10) {
      let out = 0;

      if (from > 10) number = number.toUpperCase(); //try not to perform this needlessly

      for (let i = number.length - 1; i !== -1; i--) {
        let val = codetable.indexOf(number[i]);
        if (val === -1 || val > from) return NaN;
        out += val * (from ** (number.length - i - 1));
      }

      return out;
    } else {
      return RadixConverter.convertBase(RadixConverter.convertBase(number, from, 10), 10, to);
    }
  }

  hover(key) {
    if (this.props.onHover)
      this.props.onHover(key);

  }

  unhover(key) {
    if (key === this.prevHover)
      this.hover(-1);
  }

  select(key, event) {
    if (this.props.onSelect) {
      if (key === this.prevSelect)
        this.props.onSelect(-1);
      else
        this.props.onSelect(key);

    }

    let selection = getSelection();
    let range = document.createRange();

    range.selectNodeContents(event.target);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  edit() {
    if (this.props.onEdit) {
      const UTF8 = this.radix === -1
      const radix = !UTF8 ? this.radix : 2;
      const input = !UTF8 ? this.state.input : this.state.input.join(" ").split(" ");
      
      this.props.onEdit(radix, input);
    }
  }

  addRef(key, element) {
    this.children[key] = element;
  }

  render() {
    return (
      <Card body className="radix-converter">
        <CardTitle>
          <strong>{this.radixName}</strong>
          {
            this.description ?
              <small className="text-muted">{this.description}</small>
              : undefined
          }
          {
            this.props.onEdit &&
            <Button size="sm" color="secondary" onClick={this.edit} className="edit-button float-right" href="#">
              Edit
            </Button>
          }
        </CardTitle>
        <CardText>{
          this.state.input.map((digit, key) =>
            <span
              className="digit"
              ref={this.addRef.bind(this, key)}
              onMouseEnter={this.hover.bind(this, key)}
              onMouseLeave={this.unhover.bind(this, key)}
              onClick={this.select.bind(this, key)}
              key={key}
            >
              {"" + digit}
            </span>)
        }
        </CardText>
      </Card>
    )
  }
}

export default RadixConverter;