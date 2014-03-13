
def find_first_occurrence(array, target):
    """
        Return the index of the left-most occurrence of the searched integer 
        in the sorted array or -1 if the integer is not present in the array
        O(log n)
    """

    # last element is bigger that target => -1
    if not array or target > array[-1]:
        return -1

    # perform modified binary search
    low= 0
    high = len(array)-1

    while (low <= high):
        mid = low + (high-low)/2
        if array[mid] == target:
            # target found => must check if this is the first in the group
            if mid == 0 or array[mid] > array[mid-1]:
                return mid
            else:
                high = mid-1
        elif array[mid] > target:
            high = mid-1
        else:
            low = mid+1


assert find_first_occurrence([], 4) == -1
assert find_first_occurrence([1,2,2,3], 2) == 1
assert find_first_occurrence([1,1,1,1,1], 1) == 0
assert find_first_occurrence([0,1,1,1,3], 3) == 4

