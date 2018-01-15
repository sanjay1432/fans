'use strict';
/**
 * Sort an array and allows multiple sort criteria.
 * https://gist.github.com/jherax/ce5d7ba5f7bba519a575e1dfe9cd92c8
 *
 * It applies the Schwartzian transform:
 * https://en.wikipedia.org/wiki/Schwartzian_transform
 *
 * You can fork this project on github:
 * https://github.com/jherax/array-sort-by.git
 */
const sortBy = (function () {

  const _DESC = (/^desc:\s*/i);

  // Tests whether the input value is a string and has set the flag for descending order.
  const isDesc = (v) => typeof v === 'string' && _DESC.test(v);

  // Compares each element and defines the sort order.
  function comparer(prev, next) {
    let asc = 1;
    if (prev === next) return 0;
    if (isDesc(prev)) asc = -1;
    return (prev > next ? 1 : -1) * asc;
  }

  // Compares each decorated element.
  function sortItems(aprev, anext) {
    let sorted, i;
    for (i in aprev) { // eslint-disable-line
      sorted = comparer(aprev[i], anext[i]);
      if (sorted) return sorted;
    }
    return 0;
  }

  // Defines the default sort order (ASC)
  const defaultSort = (p, n) => p < n ? -1 : +(p > n);

  /*
   * Sort an array and allows multiple sort criteria.
   *
   * @param  {Array} array: the collection to sort
   * @param  {Function} parser: transforms each item and specifies the sort order
   * @return {Array}
   */
  return function sortBy(array, parser) {
    let i, item;
    const arrLength = array.length;
    if (typeof parser === 'undefined') {
      return array.sort(defaultSort);
    }
    // Schwartzian transform (decorate-sort-undecorate)
    for (i = arrLength; i;) {
      item = array[i -= 1];
      // decorate the array
      array[i] = [].concat(parser.call(null, item, i), item);
      // console.log('decorated: ', array[i]);
    }
    // sort the array
    array.sort(sortItems);
    // undecorate the array
    for (i = arrLength; i;) {
      item = array[i -= 1];
      array[i] = item[item.length - 1];
    }
    return array;
  }
}());

module.exports = {
  sortBy: sortBy
};
