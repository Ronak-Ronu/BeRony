import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'numberAbbr'
})
export class NumberAbbrPipe implements PipeTransform {

  transform(value: number): string {
    if (!value) {
      return '0';
    }
    const suffixes = ['', 'K', 'M', 'B', 'T'];
    let tier = Math.floor(Math.log10(value) / 3);
    if (tier === 0) return value.toString();
    const scaled = value / Math.pow(10, tier * 3);
    return scaled.toFixed(1).replace(/\.0$/, '') + suffixes[tier];
  }

}
