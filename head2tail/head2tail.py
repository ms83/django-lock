"""
    2013-09-17
    Marcin Seremak <m@seremak.org>
"""
import sys

try:
    first_word = sys.argv[1]
    final_word = sys.argv[2]
except IndexError:
    print "Usage: %s <word1> <word2>" % (sys.argv[0])
    sys.exit(1)


if len(first_word) != len(final_word):
    sys.exit(2)
    

def is_candidate(s1, s2):
    """
        Returns True if two given words differ only on one position
    """
    if s1 == s2 or len(s1) != len(s2):
        return False

    diff_chars = 0
    for i in xrange(0, len(s1)):
        if s1[i] != s2[i]:
            diff_chars += 1
            if diff_chars > 1:
                return False
    
    return True


def get_candidates(word):
    """
        Returns all possible candidates for given word.
        It reuses the result if given word has been already evaluated.
    """
    global candidates_cache, words

    if word in candidates_cache:
        return candidates_cache[word]

    ret = []
    for w in words:
        if is_candidate(word, w):
            ret.append(w)
    
    candidates_cache[word] = ret
    return ret


def handle_result(path):
    """
        Prints out the program result when puzzle is solved
    """
    for word in path:
        print word
    print final_word


# Global variables
words = [word.strip() for word in open("words.txt").read().split() ]
candidates_cache = {}

paths = [ [first_word] ]
next_level_paths = []

while True:
    try:
        # Get next candidate
        path = paths.pop()
    except IndexError:
        paths = next_level_paths
        next_level_paths = []
        continue 

    # Get the last word in the path...
    word = path[-1]

    # ... and check candidates.
    for cand in get_candidates(word):
        # Continue the loop if word is already on the path
        if cand in path:
            continue

        # We got the result!
        if cand == final_word:
            handle_result(path)
            sys.exit(0)
        else:
            # Add candidate to the path
            newpath = [w for w in path]
            newpath.append(cand)
            next_level_paths.append(newpath)

    # No new candidate - no result
    if not next_level_paths:
        break
            
sys.exit(3)
